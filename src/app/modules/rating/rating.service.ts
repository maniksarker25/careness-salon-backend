/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/appError';
import Client from '../client/client.model';
import { IRating } from './rating.interface';
import Staff from '../staff/staff.model';
import { Rating } from './rating.model';
import QueryBuilder from '../../builder/QueryBuilder';
import Booking from '../booking/booking.model';
import { ENUM_BOOKING_STATUS } from '../../utilities/enum';

const createRating = async (customerId: string, payload: IRating) => {
  const shop = await Client.findById(payload.shop);
  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }
  const staff = await Staff.findById(payload.staff);
  if (!staff) {
    throw new AppError(httpStatus.NOT_FOUND, 'Staff not found');
  }

  // Verified reviews only (§ 5b Abs. 3 UWG): the customer must have a
  // completed visit (not a no-show) at this salon with this staff member, and
  // can leave one review per completed visit to the salon.
  const visitFilter = {
    customerId,
    shopId: payload.shop,
    status: ENUM_BOOKING_STATUS.COMPLETED,
    isNoShow: { $ne: true },
  };
  const [completedVisits, existingReviews] = await Promise.all([
    Booking.countDocuments(visitFilter),
    Rating.countDocuments({ customer: customerId, shop: payload.shop }),
  ]);
  const visitedThisStaff = await Booking.exists({
    ...visitFilter,
    staffId: payload.staff,
  });
  if (completedVisits === 0) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You can only review a salon after a completed appointment booked through Carenes.',
    );
  }
  if (!visitedThisStaff) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You can only rate a staff member who served you in a completed appointment.',
    );
  }
  if (existingReviews >= completedVisits) {
    throw new AppError(
      httpStatus.CONFLICT,
      'You have already reviewed this appointment.',
    );
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
