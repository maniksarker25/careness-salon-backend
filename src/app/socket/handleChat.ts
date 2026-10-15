/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { Types } from 'mongoose';
import { Server as IOServer, Socket } from 'socket.io';
import Client from '../modules/client/client.model';
import Conversation from '../modules/conversation/conversation.model';
import { buildParticipantKey } from '../modules/conversation/conversation.utils';
import Customer from '../modules/customer/customer.model';
import Message from '../modules/message/message.model';
import { USER_ROLE } from '../modules/user/user.constant';
import { sendChatPush } from './chatPush';
import {
  ChatProfileSummary,
  emitError,
  getTotalUnseenConversation,
  toChatProfileSummary,
} from './helper';

export type ChatSocketContext = {
  profileId: string;
  role: string; // USER_ROLE.customer | USER_ROLE.client
  profile: ChatProfileSummary;
};

const MAX_TEXT_LENGTH = 5000;
const MAX_FILES_PER_TYPE = 10;
const MAX_URL_LENGTH = 2048;
// Simple per-socket flood protection
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 10_000;
// Typing events are frequent, so they get their own (higher) limit
const TYPING_LIMIT_MAX = 40;
const MAX_VERIFIED_RECEIVERS = 50;

const toUrlList = (value: unknown): string[] | null => {
  if (value === undefined || value === null || value === '') return [];
  const list = Array.isArray(value) ? value : [value];
  if (list.length > MAX_FILES_PER_TYPE) return null;
  if (
    !list.every(
      (item) =>
        typeof item === 'string' && item.length > 0 && item.length <= MAX_URL_LENGTH,
    )
  ) {
    return null;
  }
  return list as string[];
};

export const emitTotalUnseenConversation = async (
  io: IOServer,
  profileId: string,
  socket?: Socket,
) => {
  const totalUnseenConversation = await getTotalUnseenConversation(profileId);
  const payload = { totalUnseenConversation };
  if (socket) {
    socket.emit('totalUnseenConversation', payload);
  } else {
    io.to(profileId).emit('totalUnseenConversation', payload);
  }
};

// Finds the conversation of a pair or creates it. `participantKey` is unique,
// so two simultaneous first messages cannot create two conversations.
const getOrCreateConversation = async (
  participantKey: string,
  participants: string[],
  participantsModel: string[],
) => {
  const find = () => Conversation.findOne({ participantKey });
  const existing = await find();
  if (existing) return existing;

  try {
    return await Conversation.create({
      participants,
      participantsModel,
      participantKey,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      const created = await find(); // lost the race, use the winner's
      if (created) return created;
    }
    throw error;
  }
};

const handleChat = (io: IOServer, socket: Socket, ctx: ChatSocketContext) => {
  const { profileId, role, profile } = ctx;
  const senderModel = role === USER_ROLE.customer ? 'Customer' : 'Client';
  const receiverModel = role === USER_ROLE.customer ? 'Client' : 'Customer';

  let windowStart = Date.now();
  let windowCount = 0;
  const isRateLimited = () => {
    const now = Date.now();
    if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
      windowStart = now;
      windowCount = 0;
    }
    windowCount += 1;
    return windowCount > RATE_LIMIT_MAX;
  };

  // Receivers already checked for "exists + opposite role", so a burst of
  // typing events costs one DB lookup per receiver, not one per event.
  const verifiedReceivers = new Set<string>();
  let typingWindowStart = Date.now();
  let typingCount = 0;
  const isTypingRateLimited = () => {
    const now = Date.now();
    if (now - typingWindowStart > RATE_LIMIT_WINDOW_MS) {
      typingWindowStart = now;
      typingCount = 0;
    }
    typingCount += 1;
    return typingCount > TYPING_LIMIT_MAX;
  };

  // badge count on connect / on demand
  emitTotalUnseenConversation(io, profileId, socket).catch((error) =>
    console.error('totalUnseenConversation error:', error),
  );
  socket.on('totalUnseenConversation', async () => {
    try {
      await emitTotalUnseenConversation(io, profileId, socket);
    } catch (error) {
      console.error('totalUnseenConversation error:', error);
    }
  });

  // ------------------------------------------------------- open / close
  // payload: { otherProfileId }  - the chat screen with that user is now open.
  // Used only to skip the push notification for messages the user is already
  // looking at. Cleared by chat:close and automatically on disconnect.
  socket.on('chat:open', (data: any) => {
    const otherProfileId = String(data?.otherProfileId || '');
    socket.data.activeChatWith = Types.ObjectId.isValid(otherProfileId)
      ? otherProfileId
      : null;
  });
  socket.on('chat:close', () => {
    socket.data.activeChatWith = null;
  });

  // ---------------------------------------------------------------- send
  // payload: { receiver, text?, imageUrl?, videoUrl?, pdfUrl? }
  // `receiver` is the other side's PROFILE id (Client._id / Customer._id).
  // The sender is always the authenticated socket user, never taken from the payload.
  socket.on('send-message', async (data: any, callback?: any) => {
    const reply = (body: Record<string, unknown>) => {
      if (typeof callback === 'function') callback(body);
    };
    const fail = (
      code: number,
      message: string,
      type: 'validation' | 'general' | 'server',
    ) => {
      emitError(socket, { code, message, type });
      reply({ success: false, message });
    };

    try {
      if (isRateLimited()) {
        return fail(429, 'You are sending messages too fast', 'general');
      }

      const receiverId = String(data?.receiver || '');
      if (!Types.ObjectId.isValid(receiverId)) {
        return fail(400, 'A valid receiver is required', 'validation');
      }
      if (receiverId === profileId) {
        return fail(400, 'You cannot message yourself', 'validation');
      }

      const text = typeof data?.text === 'string' ? data.text.trim() : '';
      if (text.length > MAX_TEXT_LENGTH) {
        return fail(
          400,
          `Message cannot exceed ${MAX_TEXT_LENGTH} characters`,
          'validation',
        );
      }
      const imageUrl = toUrlList(data?.imageUrl);
      const videoUrl = toUrlList(data?.videoUrl);
      const pdfUrl = toUrlList(data?.pdfUrl);
      if (!imageUrl || !videoUrl || !pdfUrl) {
        return fail(400, 'Invalid attachment list', 'validation');
      }
      if (!text && !imageUrl.length && !videoUrl.length && !pdfUrl.length) {
        return fail(400, 'Message cannot be empty', 'validation');
      }

      // Customers can only chat with shops and shops only with customers
      const receiverProfile: any =
        receiverModel === 'Client'
          ? await Client.findById(receiverId).select(
              'user firstName lastName shopName shopImages profile_image isDeleted',
            )
          : await Customer.findById(receiverId).select(
              'user firstName lastName profile_image isDeleted',
            );
      if (!receiverProfile || receiverProfile.isDeleted) {
        return fail(404, 'Receiver not found', 'validation');
      }

      const participantKey = buildParticipantKey(profileId, receiverId);
      const conversation = await getOrCreateConversation(
        participantKey,
        [profileId, receiverId],
        [senderModel, receiverModel],
      );

      const message = await Message.create({
        text,
        imageUrl,
        videoUrl,
        pdfUrl,
        msgByUserId: profileId,
        msgByUserModel: senderModel,
        receiverId,
        receiverModel,
        conversationId: conversation._id,
      });

      await Conversation.updateOne(
        { _id: conversation._id },
        {
          $set: {
            lastMessage: message._id,
            lastMessageAt: message.createdAt,
          },
        },
      );

      const messageData = message.toObject();
      const receiverSummary = toChatProfileSummary(
        receiverProfile,
        receiverModel,
      );

      // both sides get the message (all their devices are in the room)
      io.to(profileId).to(receiverId).emit('message:new', messageData);

      // chat list row update; `userData` is the OTHER user from each side's view
      io.to(profileId).emit('conversation:update', {
        conversationId: conversation._id,
        lastMessage: messageData,
        unreadDelta: 0,
        userData: receiverSummary,
      });
      io.to(receiverId).emit('conversation:update', {
        conversationId: conversation._id,
        lastMessage: messageData,
        unreadDelta: 1,
        userData: profile,
      });

      reply({ success: true, data: messageData });

      // push if the receiver is not already looking at this chat (never throws)
      void sendChatPush(io, {
        sender: profile,
        senderModel,
        receiverId,
        conversationId: conversation._id.toString(),
        text,
        imageUrl,
        videoUrl,
        pdfUrl,
      });

      await emitTotalUnseenConversation(io, receiverId);
    } catch (error) {
      console.error('send-message error:', error);
      fail(500, 'Failed to send message', 'server');
    }
  });

  // -------------------------------------------------------------- typing
  // payload: { receiver, isTyping }  - not stored, only relayed to the receiver.
  // Invalid or flooding events are silently dropped (typing is best effort).
  socket.on('typing', async (data: any) => {
    try {
      const receiverId = String(data?.receiver || '');
      if (
        !Types.ObjectId.isValid(receiverId) ||
        receiverId === profileId ||
        typeof data?.isTyping !== 'boolean' ||
        isTypingRateLimited()
      ) {
        return;
      }

      if (!verifiedReceivers.has(receiverId)) {
        const exists = await (receiverModel === 'Client' ? Client : Customer).exists({
          _id: receiverId,
          isDeleted: { $ne: true },
        });
        if (!exists) return;
        if (verifiedReceivers.size >= MAX_VERIFIED_RECEIVERS) {
          verifiedReceivers.clear();
        }
        verifiedReceivers.add(receiverId);
      }

      io.to(receiverId).emit('typing', {
        from: profileId,
        isTyping: data.isTyping,
      });
    } catch (error) {
      console.error('typing error:', error);
    }
  });

  // ---------------------------------------------------------------- seen
  // payload: { conversationId }  - marks everything addressed to me as seen
  socket.on('seen', async (data: any) => {
    try {
      const conversationId = String(data?.conversationId || '');
      if (!Types.ObjectId.isValid(conversationId)) {
        return emitError(socket, {
          code: 400,
          message: 'A valid conversationId is required',
          type: 'validation',
        });
      }

      // receiverId = me, so only my own incoming messages can be touched
      const result = await Message.updateMany(
        { conversationId, receiverId: profileId, seen: false },
        { $set: { seen: true } },
      );
      if (result.modifiedCount === 0) return;

      const conversation = await Conversation.findById(conversationId)
        .select('participants')
        .lean();
      const otherUserId = conversation?.participants.find(
        (participant) => participant.toString() !== profileId,
      );

      io.to(profileId).emit('conversation:seen', {
        conversationId,
        unreadCount: 0,
      });
      if (otherUserId) {
        io.to(otherUserId.toString()).emit('message:seen', {
          conversationId,
          seenBy: profileId,
        });
      }
      await emitTotalUnseenConversation(io, profileId);
    } catch (error) {
      console.error('seen error:', error);
      emitError(socket, {
        code: 500,
        message: 'Failed to update seen status',
        type: 'server',
      });
    }
  });
};

export default handleChat;
