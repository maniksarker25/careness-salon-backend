/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose, { PipelineStage } from 'mongoose';
import AppError from '../../error/appError';
import Client from '../client/client.model';
import Conversation from '../conversation/conversation.model';
import {
  buildParticipantKey,
  getPositiveNumber,
} from '../conversation/conversation.utils';
import Customer from '../customer/customer.model';
import { USER_ROLE } from '../user/user.constant';
import Message from './message.model';

type TChatModel = 'Customer' | 'Client';

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getPaging = (query: Record<string, unknown>) => ({
  page: getPositiveNumber(query.page, 1),
  limit: getPositiveNumber(query.limit, 20, 100),
});

// Both message endpoints return exactly this shape:
//   { conversationId, userData, meta, result }
const emptyPage = (
  query: Record<string, unknown>,
  conversationId: unknown,
  userData: unknown,
) => {
  const { page, limit } = getPaging(query);
  return {
    conversationId,
    userData,
    meta: { page, limit, total: 0, totalPage: 0 },
    result: [] as any[],
  };
};


const getChatUserData = async (model: TChatModel, profileId: unknown) => {
  const isShop = model === 'Client';
  const profile: any = isShop
    ? await Client.findById(profileId)
        .select(
          'user email firstName lastName shopName shopImages profile_image isDeleted',
        )
        .lean()
    : await Customer.findById(profileId)
        .select('user email firstName lastName profile_image isDeleted')
        .lean();

  if (!profile || profile.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const fullName = `${profile.firstName || ''} ${
    profile.lastName || ''
  }`.trim();
  return {
    _id: profile._id,
    user: profile.user,
    email: profile.email,
    name: (isShop && profile.shopName) || fullName,
    profile_image:
      (isShop && profile.shopImages?.[0]) || profile.profile_image || '',
  };
};


const getMessagePage = async (
  profileObjectId: mongoose.Types.ObjectId,
  conversationObjectId: mongoose.Types.ObjectId,
  query: Record<string, unknown>,
) => {
  const { page, limit } = getPaging(query);
  const skip = (page - 1) * limit;
  const searchTerm = String(query.searchTerm || '').trim();

  const match: PipelineStage.Match['$match'] = {
    conversationId: conversationObjectId,
  };
  if (searchTerm) {
    match.text = { $regex: escapeRegex(searchTerm), $options: 'i' };
  }


  const pipeline: PipelineStage[] = [
    { $match: match },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        totalCount: [{ $count: 'total' }],
        result: [
          { $skip: skip },
          { $limit: limit },
          {
            $addFields: {
              isMyMessage: { $eq: ['$msgByUserId', profileObjectId] },
            },
          },
        ],
      },
    },
  ];

  const [messages] = await Message.aggregate<{
    totalCount: { total: number }[];
    result: any[];
  }>(pipeline);

  const total = messages?.totalCount?.[0]?.total || 0;

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    result: messages?.result || [],
  };
};

// Messages of one conversation, newest first, paginated. Only a participant
// of the conversation can read it.
const getMessagesByConversationId = async (
  profileId: string,
  conversationId: string,
  query: Record<string, unknown>,
) => {
  if (
    !mongoose.isValidObjectId(profileId) ||
    !mongoose.isValidObjectId(conversationId)
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid id');
  }

  const profileObjectId = new mongoose.Types.ObjectId(profileId);
  const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

  const conversation = await Conversation.findOne({
    _id: conversationObjectId,
    participants: profileObjectId,
  })
    .select('participants participantsModel')
    .lean();

  if (!conversation) return emptyPage(query, conversationId, null);

  // the other participant (id + model are paired by array position)
  const otherIndex = conversation.participants.findIndex(
    (participant) => participant.toString() !== profileId,
  );
  const [userData, page] = await Promise.all([
    otherIndex === -1
      ? null
      : getChatUserData(
          conversation.participantsModel[otherIndex] as TChatModel,
          conversation.participants[otherIndex],
        ),
    getMessagePage(profileObjectId, conversationObjectId, query),
  ]);

  return { conversationId, userData, ...page };
};


const getMessagesWithUser = async (
  profileId: string,
  role: string,
  otherProfileId: string,
  query: Record<string, unknown>,
) => {
  if (
    !mongoose.isValidObjectId(profileId) ||
    !mongoose.isValidObjectId(otherProfileId)
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid id');
  }
  if (profileId === otherProfileId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You cannot message yourself');
  }

  // customers chat with shops, shops with customers
  const otherModel: TChatModel =
    role === USER_ROLE.customer ? 'Client' : 'Customer';

  const [userData, conversation] = await Promise.all([
    getChatUserData(otherModel, otherProfileId),
    Conversation.findOne({
      participantKey: buildParticipantKey(profileId, otherProfileId),
    })
      .select('_id')
      .lean(),
  ]);

  if (!conversation) return emptyPage(query, null, userData);

  const page = await getMessagePage(
    new mongoose.Types.ObjectId(profileId),
    conversation._id,
    query,
  );
  return { conversationId: conversation._id, userData, ...page };
};

const MessageService = { getMessagesByConversationId, getMessagesWithUser };

export default MessageService;
