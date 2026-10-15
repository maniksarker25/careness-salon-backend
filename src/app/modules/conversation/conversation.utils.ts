/* eslint-disable @typescript-eslint/no-explicit-any */
import { PipelineStage } from 'mongoose';

export const getPositiveNumber = (
  value: unknown,
  defaultValue: number,
  max?: number,
) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return max ? Math.min(parsed, max) : parsed;
};

// Fields of a chat participant sent to the app, per profile type.
//   Customer -> "First Last" + profile_image
//   Client   -> shopName (fallback "First Last") + first shop image
const customerProjection = {
  _id: 1,
  user: 1,
  email: 1,
  name: { $concat: ['$firstName', ' ', '$lastName'] },
  profile_image: 1,
};

const clientProjection = {
  _id: 1,
  user: 1,
  email: 1,
  name: {
    $cond: [
      { $gt: [{ $strLenCP: { $ifNull: ['$shopName', ''] } }, 0] },
      '$shopName',
      { $concat: ['$firstName', ' ', '$lastName'] },
    ],
  },
  profile_image: {
    $ifNull: [{ $arrayElemAt: ['$shopImages', 0] }, '$profile_image'],
  },
};

/**
 * Adds `<as>` = { _id, user, name, email, profile_image } for the profile whose
 * id/model are given by the aggregation expressions `idField` / `modelField`
 * (e.g. '$other.id', '$other.model').
 * Only the matching collection is actually queried (the other lookup matches
 * nothing because of the model check).
 */
export const lookupChatProfile = (
  idField: string,
  modelField: string,
  as: string,
): PipelineStage.FacetPipelineStage[] => {
  const build = (
    from: string,
    model: string,
    projection: any,
  ): PipelineStage.FacetPipelineStage =>
    ({
      $lookup: {
        from,
        let: { pid: idField, pmodel: modelField },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$_id', '$$pid'] },
                  { $eq: ['$$pmodel', model] },
                ],
              },
            },
          },
          { $project: projection },
        ],
        as: `${as}_${model}`,
      },
    }) as PipelineStage.FacetPipelineStage;

  return [
    build('customers', 'Customer', customerProjection),
    build('clients', 'Client', clientProjection),
    {
      $addFields: {
        [as]: {
          $ifNull: [
            { $arrayElemAt: [`$${as}_Customer`, 0] },
            { $arrayElemAt: [`$${as}_Client`, 0] },
          ],
        },
      },
    },
    { $project: { [`${as}_Customer`]: 0, [`${as}_Client`]: 0 } },
  ];
};

// One conversation per pair of profiles, whoever writes first: the same key is
// produced for (a, b) and (b, a).
export const buildParticipantKey = (profileA: string, profileB: string) =>
  [profileA, profileB].sort().join(':');
