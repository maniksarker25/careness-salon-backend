/* eslint-disable no-unused-vars */
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import cron from 'node-cron';
import config from '../../config';
import AppError from '../../error/appError';
import isAccountReady from '../../helper/isAccountReady';
import registrationSuccessEmailBody from '../../mailTemplete/registerSuccessEmail';
import {
  getOtpExpiryDate,
  UNVERIFIED_USER_CLEANUP_GRACE_MINUTES,
} from '../../utilities/otp';
import sendEmail from '../../utilities/sendEmail';
import { IAdmin } from '../admin/admin.interface';
import Admin from '../admin/admin.model';
import Booking from '../booking/booking.model';
import BusinessHour from '../bussinessHour/businessHour.model';
import { IClient } from '../client/client.interface';
import Client from '../client/client.model';
import { ICustomer } from '../customer/customer.interface';
import Customer from '../customer/customer.model';
import { upsertDevice } from '../device/device.service';
import Staff from '../staff/staff.model';
import SuperAdmin from '../superAdmin/superAdmin.model';
import { USER_ROLE } from './user.constant';
import { TUser, TUserRole } from './user.interface';
import { User } from './user.model';
import { createToken } from './user.utils';

const generateVerifyCode = (): number => {
  return Math.floor(1000 + Math.random() * 9000);
};

const registerCustomer = async (
  password: string,
  confirmPassword: string,
  customerData: ICustomer,
  platform?: string,
  playerId?: string,
) => {
  if (password !== confirmPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Password and confirm password doesn't match",
    );
  }
  const user = await User.isUserExists(customerData.email);
  if (user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This user already exists');
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const verifyCode = generateVerifyCode();
    const userData: Partial<TUser> = {
      email: customerData?.email,
      password: password,
      role: USER_ROLE.customer,
      verifyCode,
      codeExpireIn: getOtpExpiryDate(),
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const user = await User.create([userData], { session });

    const customerPayload = {
      ...customerData,
      user: user[0]._id,
    };
    const customer = await Customer.create([customerPayload], { session });

    const platformm = platform ? platform : 'android';

    // device register (IMPORTANT)
    if (playerId) {
      await upsertDevice(customer[0]._id.toString(), playerId, platformm);
    }

    sendEmail({
      email: user[0].email,
      subject: 'Activate Your Account',
      html: registrationSuccessEmailBody(
        customer[0].firstName,
        user[0].verifyCode,
      ),
    });

    await session.commitTransaction();
    session.endSession();

    return customer[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const registerClient = async (
  password: string,
  confirmPassword: string,
  clientData: IClient,
) => {
  if (password !== confirmPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Password and confirm password doesn't match",
    );
  }

  const clientExists = await User.isUserExists(clientData?.email);
  if (clientExists) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This user already exists');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const verifyCode = generateVerifyCode();
    const userData: Partial<TUser> = {
      email: clientData?.email,
      password: password,
      role: USER_ROLE.client,
      isActive: false,
      verifyCode,
      codeExpireIn: getOtpExpiryDate(),
    };

    const user = await User.create([userData], { session });

    const clientPayload = {
      ...clientData,
      user: user[0]._id,
    };
    const client = await Client.create([clientPayload], { session });

    // Define default business hours (Sunday closed, other days 9:00 AM - 6:00 PM)
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
      entityId: client[0]._id, // Associate business hours with the created client
      entityType: 'Shop', // Assuming client is a Shop entity
    }));

    // Create default business hours for the client
    await BusinessHour.create(defaultBusinessHours, { session, ordered: true });

    sendEmail({
      email: user[0].email,
      subject: 'Activate Your Account',
      html: registrationSuccessEmailBody(
        client[0].firstName,
        user[0].verifyCode,
      ),
    });

    await session.commitTransaction();
    session.endSession();

    return client[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// register Admin
const registerAdmin = async (password: string, adminData: IAdmin) => {
  const admin = await User.isUserExists(adminData?.email);
  if (admin) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This admin already exists');
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userData: Partial<TUser> = {
      email: adminData?.email,
      phoneNumber: adminData?.phoneNumber,
      password: password,
      role: USER_ROLE.admin,
      isActive: true,
      isVerified: true,
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const user = await User.create([userData], { session });

    const adminPayload = {
      ...adminData,
      user: user[0]._id,
    };
    const admin = await Admin.create([adminPayload], { session });

    await session.commitTransaction();
    session.endSession();

    return admin[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getMyProfile = async (email: string, role: string) => {
  let result = null;
  if (role === USER_ROLE.customer) {
    result = await Customer.findOne({ email: email });
  }
  if (role === USER_ROLE.client) {
    const data = await Client.findOne({ email: email });
    const accountReady = await isAccountReady(data.stripAccountId);
    const totalStaff = await Staff.countDocuments({ shop: data._id });
    result = {
      ...data.toObject(),
      isAccountReady: accountReady,
      totalStaff,
    };
  }
  if (role === USER_ROLE.admin) {
    result = await Admin.findOne({ email: email });
  }
  if (role === USER_ROLE.superAdmin) {
    result = await SuperAdmin.findOne({ email: email });
  }

  // if (result && (role === USER_ROLE.customer || role === USER_ROLE.client)) {
  //   const profileId = (
  //     result as {
  //       _id?: { toString: () => string };
  //     }
  //   )._id?.toString();

  //   if (profileId) {
  //     appEventEmitter.emit('profile.fetched', {
  //       receiver: profileId,
  //       title: 'Profile Retrieved',
  //       message: 'Your profile was retrieved successfully.',
  //       meta: {
  //         role,
  //         profileId,
  //       },
  //     });
  //   }
  // }

  return result;
};

const verifyCode = async (email: string, verifyCode: number) => {
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (user.codeExpireIn < new Date(Date.now())) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Verify code is expired');
  }
  if (verifyCode !== user.verifyCode) {
    throw new AppError(httpStatus.BAD_REQUEST, "Code doesn't match");
  }

  if (user.verifyCode === verifyCode) {
    await User.findOneAndUpdate(
      { email: email },
      { isVerified: true },
      { new: true, runValidators: true },
    );
  }

  const jwtPayload = {
    id: user?._id,
    email: user?.email,
    role: user?.role as TUserRole,
  };
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );
  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string,
  );
  return {
    accessToken,
    refreshToken,
  };
};

const resendVerifyCode = async (email: string) => {
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  const verifyCode = generateVerifyCode();
  const updateUser = await User.findOneAndUpdate(
    { email: email },
    { verifyCode: verifyCode, codeExpireIn: getOtpExpiryDate() },
    { new: true, runValidators: true },
  );
  if (!updateUser) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error occurred while updating',
    );
  }
  sendEmail({
    email: updateUser.email,
    subject: 'Activate Your Account',
    html: registrationSuccessEmailBody('Dear', updateUser.verifyCode),
  });
};

// block , unblock user
const blockUnblockUser = async (id: string, status: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const result = await User.findByIdAndUpdate(
    id,
    { status: status },
    { new: true, runValidators: true },
  );

  return result;
};

const deleteAccount = async (
  userData: JwtPayload,
  payload: { password: string },
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userData.id).session(session);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    const isMatch = await User.isPasswordMatched(
      payload?.password,
      user?.password,
    );
    if (!isMatch) {
      throw new AppError(httpStatus.FORBIDDEN, 'Password does not match');
    }

    if (userData.role === USER_ROLE.client) {
      const client = await Client.findOne({ user: userData.id }).session(
        session,
      );
      if (client) {
        const activeBooking = await Booking.findOne({
          shopId: client._id,
          status: 'booked',
        }).session(session);

        if (activeBooking) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            'You have to complete all upcoming bookings or cancel these bookings and then you can delete your account.',
          );
        }
      }
      await Client.findOneAndDelete({ user: userData.id }).session(session);
    }

    if (userData.role === USER_ROLE.customer) {
      await Customer.findOneAndDelete({ user: userData.id }).session(session);
    }

    await User.findByIdAndDelete(userData.id).session(session);

    await session.commitTransaction();
    session.endSession();

    return { success: true, message: 'Account deleted successfully' };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// crone jobs -------------
cron.schedule('*/2 * * * *', async () => {
  try {
    // Only clean up accounts well after their code expired, so users who
    // verify late see "code is expired" and can resend, not "user not found".
    const cleanupCutoff = new Date(
      Date.now() - UNVERIFIED_USER_CLEANUP_GRACE_MINUTES * 60 * 1000,
    );

    const expiredUsers = await User.find({
      isVerified: false,
      codeExpireIn: { $lte: cleanupCutoff },
    });

    if (expiredUsers.length > 0) {
      const expiredUserIds = expiredUsers.map((user) => user._id);

      // Delete corresponding NormalUser documents
      const customerDeleteResult = await Customer.deleteMany({
        user: { $in: expiredUserIds },
      });
      const clientDeleteResult = await Client.deleteMany({
        user: { $in: expiredUserIds },
      });

      // Delete the expired User documents
      const userDeleteResult = await User.deleteMany({
        _id: { $in: expiredUserIds },
      });

      console.log(
        `Deleted ${userDeleteResult.deletedCount} expired inactive users`,
      );
      console.log(
        `Deleted ${customerDeleteResult.deletedCount} associated customer documents`,
      );
      console.log(
        `Deleted ${clientDeleteResult.deletedCount} associated client documents`,
      );
    }
  } catch (error) {
    console.log('Error deleting expired users and associated data:', error);
  }
});

const userServices = {
  registerCustomer,
  registerClient,
  registerAdmin,
  getMyProfile,
  verifyCode,
  resendVerifyCode,
  blockUnblockUser,
  deleteAccount,
};

export default userServices;
