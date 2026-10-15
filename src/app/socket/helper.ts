/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { Types } from 'mongoose';
import Message from '../modules/message/message.model';

export type SocketError = {
  code: number;
  message: string;
  type: 'validation' | 'database' | 'auth' | 'general' | 'server';
  details?: any;
};

// Emit an error to one socket (event: `socket-error`)
export const emitError = (socket: any, error: SocketError) => {
  console.error(`Socket Error [${error.type}]:`, error);
  socket.emit('socket-error', error);
};

// Small public view of a Customer/Client profile used inside chat events
export type ChatProfileSummary = {
  _id: string;
  user: string;
  name: string;
  profile_image: string;
};

export const toChatProfileSummary = (
  profile: any,
  model: 'Customer' | 'Client',
): ChatProfileSummary => {
  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
  const isShop = model === 'Client';
  return {
    _id: profile._id.toString(),
    user: profile.user?.toString() || '',
    name: (isShop && profile.shopName) || fullName,
    profile_image:
      (isShop && profile.shopImages?.[0]) || profile.profile_image || '',
  };
};

// Number of conversations that have at least one unseen message for this
// profile (the chat badge). Uses the {receiverId, seen, createdAt} index.
export const getTotalUnseenConversation = async (profileId: string) => {
  if (!Types.ObjectId.isValid(profileId)) return 0;
  const conversationIds = await Message.distinct('conversationId', {
    receiverId: new Types.ObjectId(profileId),
    seen: false,
  });
  return conversationIds.length;
};
