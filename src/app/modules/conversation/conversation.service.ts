/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose, { PipelineStage } from 'mongoose';
import AppError from '../../error/appError';
import Conversation from './conversation.model';
import { getPositiveNumber, lookupChatProfile } from './conversation.utils';


const getConversation = async (
  profileId: string,
  query: Record<string, unknown>,
) => {
  if (!mongoose.isValidObjectId(profileId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid profile id');
  }
  const profileObjectId = new mongoose.Types.ObjectId(profileId);

  const page = getPositiveNumber(query.page, 1);
  const limit = getPositiveNumber(query.limit, 10, 50);
  const skip = (page - 1) * limit;

  const pipeline: PipelineStage[] = [
    { $match: { participants: profileObjectId } },
    { $sort: { lastMessageAt: -1, updatedAt: -1 } },
    {
      $facet: {
        meta: [{ $count: 'total' }],
        data: [
          { $skip: skip },
          { $limit: limit },
          // The other participant (id + model), paired by array position
          {
            $addFields: {
              other: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: {
                        $map: {
                          input: { $range: [0, { $size: '$participants' }] },
                          as: 'i',
                          in: {
                            id: { $arrayElemAt: ['$participants', '$$i'] },
                            model: {
                              $arrayElemAt: ['$participantsModel', '$$i'],
                            },
                          },
                        },
                      },
                      as: 'p',
                      cond: { $ne: ['$$p.id', profileObjectId] },
                    },
                  },
                  0,
                ],
              },
            },
          },
          ...lookupChatProfile('$other.id', '$other.model', 'userData'),
          // Unseen messages addressed to me in this conversation
          {
            $lookup: {
              from: 'messages',
              let: { cid: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$conversationId', '$$cid'] },
                        { $eq: ['$receiverId', profileObjectId] },
                        { $eq: ['$seen', false] },
                      ],
                    },
                  },
                },
                { $count: 'count' },
              ],
              as: 'unseenCountData',
            },
          },
          {
            $lookup: {
              from: 'messages',
              let: { mid: '$lastMessage' },
              pipeline: [
                { $match: { $expr: { $eq: ['$_id', '$$mid'] } } },
                {
                  $project: {
                    text: 1,
                    imageUrl: 1,
                    videoUrl: 1,
                    pdfUrl: 1,
                    msgByUserId: 1,
                    msgByUserModel: 1,
                    receiverId: 1,
                    receiverModel: 1,
                    seen: 1,
                    createdAt: 1,
                  },
                },
              ],
              as: 'lastMessage',
            },
          },
          {
            $addFields: {
              unseenMsg: {
                $ifNull: [{ $arrayElemAt: ['$unseenCountData.count', 0] }, 0],
              },
              lastMessage: { $arrayElemAt: ['$lastMessage', 0] },
            },
          },
          {
            $project: {
              _id: 1,
              createdAt: 1,
              updatedAt: 1,
              lastMessageAt: 1,
              unseenMsg: 1,
              lastMessage: 1,
              userData: 1,
            },
          },
        ],
      },
    },
  ];

  const [result] = await Conversation.aggregate<{
    meta: { total: number }[];
    data: any[];
  }>(pipeline);

  const total = result?.meta?.[0]?.total || 0;

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data: result?.data || [],
  };
};

const ConversationService = { getConversation };

export default ConversationService;
