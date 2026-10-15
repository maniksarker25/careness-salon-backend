/* eslint-disable @typescript-eslint/no-explicit-any */

import QueryBuilder from '../../builder/QueryBuilder';

import { User } from '../user/user.model';
import AppError from '../../error/appError';
import httpStatus from 'http-status';
import { IAdmin } from './admin.interface';
import Admin from './admin.model';
import mongoose from 'mongoose';

const updateAdminProfile = async (userId: string, payload: Partial<IAdmin>) => {
  const result = await Admin.findOneAndUpdate({ user: userId }, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const deleteAdminFromDB = async (id: string) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const admin = await Admin.findById(id).session(session);
    if (!admin) {
      throw new AppError(httpStatus.NOT_FOUND, 'Admin not found');
    }

    // Delete associated User and Admin within the transaction
    await User.findByIdAndDelete(admin.user).session(session);
    await Admin.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return null;
  } catch (error) {
    await session.abortTransaction();
    throw error; // re-throw the error for further handling
  } finally {
    session.endSession();
  }
};

// update Admin status
const updateAdminStatus = async (id: string, status: string) => {
  const session = await Admin.startSession();
  session.startTransaction();

  try {
    const result = await Admin.findByIdAndUpdate(
      id,
      { status: status },
      { runValidators: true, new: true, session: session },
    );

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Admin not found');
    }

    const isActive = status === 'active';

    await User.findOneAndUpdate(
      { _id: result.user },
      { isActive: isActive },
      { runValidators: true, new: true, session: session },
    );

    await session.commitTransaction();
    session.endSession();

    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Something went wrong ,try again letter ',
    );
  }
};

// get all Admin

const getAllAdminFromDB = async (query: Record<string, any>) => {
  const AdminQuery = new QueryBuilder(Admin.find(), query)
    .search(['storeName'])
    .fields()
    .filter()
    .paginate()
    .sort();
  const meta = await AdminQuery.countTotal();
  const result = await AdminQuery.modelQuery;

  return {
    meta,
    result,
  };
};

// rating
const addRating = async (shopId: string, rating: number) => {
  const result = await Admin.findByIdAndUpdate(
    shopId,
    {
      $inc: { totalRating: 1, totalRatingCount: rating },
    },
    { new: true, runValidators: true },
  );
  return result;
};

const AdminServices = {
  updateAdminProfile,
  updateAdminStatus,
  getAllAdminFromDB,
  addRating,
  deleteAdminFromDB,
};

export default AdminServices;
