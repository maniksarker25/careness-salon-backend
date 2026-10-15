import { REVENUE_BOOKING_MATCH } from '../booking/booking.revenue';
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/appError';
import Booking from '../booking/booking.model';
import BusinessHour from '../bussinessHour/businessHour.model';
import Service from '../service/service.model';
import { IStaff } from './staff.interface';
import Staff from './staff.model';

const createStaffIntoDB = async (profileId: string, payload: IStaff) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Create staff with session
    const [staff] = await Staff.create([{ ...payload, shop: profileId }], {
      session,
      ordered: true,
    });
    const defaultBusinessHours = [
      { day: 'Monday', openTime: '09:00', closeTime: '18:00', isClosed: false },
      {
        day: 'Tuesday',
        openTime: '09:00',
        closeTime: '18:00',
        isClosed: false,
      },
      {
        day: 'Wednesday',
        openTime: '09:00',
        closeTime: '18:00',
        isClosed: false,
      },
      {
        day: 'Thursday',
        openTime: '09:00',
        closeTime: '18:00',
        isClosed: false,
      },
      { day: 'Friday', openTime: '09:00', closeTime: '18:00', isClosed: false },
      {
        day: 'Saturday',
        openTime: '09:00',
        closeTime: '18:00',
        isClosed: false,
      },
      { day: 'Sunday', openTime: '09:00', closeTime: '18:00', isClosed: true },
    ].map((hour) => ({
      ...hour,
      entityId: staff._id,
      entityType: 'Staff',
    }));

    // Create business hours with session
    await BusinessHour.create(defaultBusinessHours, { session, ordered: true });

    // Commit the transaction if everything succeeded
    await session.commitTransaction();
    session.endSession();

    return staff;
  } catch (error) {
    // Roll back any changes made in the transaction
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// update staff
const updateStaffIntoDB = async (id: string, payload: Partial<IStaff>) => {
  const staff = await Staff.findById(id);
  if (!staff) {
    throw new AppError(httpStatus.NOT_FOUND, 'Staff not found');
  }

  const result = await Staff.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const deleteStaffFromDB = async (id: string) => {
  await Staff.findByIdAndDelete(id);
  await BusinessHour.deleteMany({ entityId: id, entityType: 'Staff' });
  return null;
};

const getAllStaff = async (query: Record<string, any>) => {
  const totalSales = await Booking.aggregate([
    { $match: REVENUE_BOOKING_MATCH },
    {
      $group: {
        _id: '$staffId',
        totalSales: { $sum: '$totalPrice' },
      },
    },
  ]);

  const salesMap = totalSales.reduce(
    (acc, sale) => {
      acc[sale._id.toString()] = sale.totalSales;
      return acc;
    },
    {} as Record<string, number>,
  );
  const StaffQuery = new QueryBuilder(
    Staff.find()
      .select(
        'name specialty phoneNumber profile_image totalRating totalRatingCount',
      )
      .populate({ path: 'shop', select: 'shopName' }),
    query,
  )
    .search(['name'])
    .fields()
    .filter()
    .paginate()
    .sort();

  const meta = await StaffQuery.countTotal();
  const staffs = await StaffQuery.modelQuery;

  const staffWithSales = staffs.map((staff) => {
    const staffId = staff._id.toString();
    return {
      ...staff.toObject(),
      totalSales: salesMap[staffId] || 0, // Add totalSales, defaulting to 0 if not found
    };
  });
  if (query.sort === 'topSelling') {
    staffWithSales.sort((a, b) => b.totalSales - a.totalSales); // Sort descending by totalSales
  }
  return {
    meta,
    result: staffWithSales,
  };
};

const getMyStaff = async (shopId: string) => {
  try {
    // Fetch staff for the given shop
    const staffList = await Staff.find({ shop: shopId });

    return staffList;
  } catch (error) {
    throw new Error('Unable to fetch staff information.');
  }
};
const getShopStaffs = async (shopId: string) => {
  try {
    // Fetch staff for the given shop
    const staffList = await Staff.find({ shop: shopId }).select(
      'name specialty profile_image totalRating totalRatingCount',
    );

    return staffList;
  } catch (error) {
    throw new Error('Unable to fetch staff information.');
  }
};

const getSingleStaff = async (staffId: string) => {
  const staff = await Staff.findById(staffId);
  if (!staff) {
    throw new AppError(httpStatus.NOT_FOUND, 'Staff not found');
  }

  if (staff.services === 'all-services') {
    // Return 'all-services' as is
    return {
      ...staff.toObject(),
      services: 'all-services',
    };
  } else if (Array.isArray(staff.services)) {
    // Populate specific services
    const specificServices = await Service.find({
      _id: { $in: staff.services },
    }).select('serviceName');
    return {
      ...staff.toObject(),
      services: specificServices,
    };
  } else {
    return staff.toObject(); // Return as is for unexpected cases
  }
};

// get available staff
const getAvailableStaff = async (payload: {
  shopId: string;
  services: string[];
}) => {
  const { shopId, services } = payload;
  // Find staff with matching shopId and whose services array includes all specified service IDs
  const result = await Staff.find({
    shop: shopId,
    $or: [{ services: { $all: services } }, { services: 'all-services' }],
  });

  return result;
};

const StaffServices = {
  createStaffIntoDB,
  updateStaffIntoDB,
  deleteStaffFromDB,
  getAllStaff,
  getMyStaff,
  getAvailableStaff,
  getSingleStaff,
  getShopStaffs,
};

export default StaffServices;
