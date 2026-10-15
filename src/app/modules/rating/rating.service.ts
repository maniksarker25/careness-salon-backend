/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/appError';
import Client from '../client/client.model';
import { IRating } from './rating.interface';
import Staff from '../staff/staff.model';
import { Rating } from './rating.model';
import QueryBuilder from '../../builder/QueryBuilder';

const createRating = async (customerId: string, payload: IRating) => {
  const shop = await Client.findById(payload.shop);
  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }
  const staff = await Staff.findById(payload.staff);
  if (!staff) {
    throw new AppError(httpStatus.NOT_FOUND, 'Staff not found');
  }

  const result = await Rating.create({ ...payload, customer: customerId });

  await Client.findByIdAndUpdate(payload.shop, {
    $inc: { totalRating: payload.shopRating, totalRatingCount: 1 },
  });
  await Staff.findByIdAndUpdate(payload.staff, {
    $inc: { totalRating: payload.staffRating, totalRatingCount: 1 },
  });

  return result;
};

// get sob rating
const getSobRating = async (shopId: string, query: Record<string, any>) => {
  const sobRatingQuery = new QueryBuilder(
    Rating.find({ shop: shopId }).populate({
      path: 'customer',
      select: 'firstName lastName city',
    }),
    query,
  )
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await sobRatingQuery.countTotal();

  const result = await sobRatingQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const RatingServices = {
  createRating,
  getSobRating,
};

export default RatingServices;
