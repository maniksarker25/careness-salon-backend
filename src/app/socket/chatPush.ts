/* eslint-disable no-console */
import { Server as IOServer } from 'socket.io';
import sendPushNotification from '../helper/sendPushNotification';
import { Device } from '../modules/device/device.model';
import { ChatProfileSummary } from './helper';

const MAX_PUSH_BODY_LENGTH = 100;

type ChatPushInput = {
  sender: ChatProfileSummary;
  senderModel: 'Customer' | 'Client';
  receiverId: string;
  conversationId: string;
  text: string;
  imageUrl: string[];
  videoUrl: string[];
  pdfUrl: string[];
};

const buildBody = ({ text, imageUrl, videoUrl, pdfUrl }: ChatPushInput) => {
  if (text) {
    return text.length > MAX_PUSH_BODY_LENGTH
      ? `${text.slice(0, MAX_PUSH_BODY_LENGTH - 1)}…`
      : text;
  }
  if (imageUrl.length) return 'Sent a photo';
  if (videoUrl.length) return 'Sent a video';
  if (pdfUrl.length) return 'Sent a document';
  return 'Sent a message';
};

/**
 * Push notification for a new chat message. Deliberately NOT stored in the
 * in-app notification list (that would get one entry per message).
 *
 * Skipped when the receiver currently has this exact chat open on any of their
 * connected devices (`socket.data.activeChatWith` is set by the `chat:open`
 * socket event). Never throws: a push problem must not affect message sending.
 */
export const sendChatPush = async (io: IOServer, input: ChatPushInput) => {
  try {
    const { sender, senderModel, receiverId, conversationId } = input;

    const receiverSockets = await io.in(receiverId).fetchSockets();
    const isViewingThisChat = receiverSockets.some(
      (receiverSocket) => receiverSocket.data?.activeChatWith === sender._id,
    );
    if (isViewingThisChat) return;

    const devices = await Device.find({ userId: receiverId, isActive: true })
      .select('playerId')
      .lean();
    const playerIds = devices.map((device) => device.playerId).filter(Boolean);
    if (playerIds.length === 0) return;

    await sendPushNotification({
      playerIds,
      heading: sender.name || 'New message',
      message: buildBody(input),
      // a burst of messages in one chat replaces the previous push
      collapseId: `chat-${conversationId}`,
      data: {
        type: 'chat',
        conversationId,
        senderId: sender._id,
        senderModel,
      },
    });
  } catch (error) {
    console.error('sendChatPush error:', error);
  }
};
