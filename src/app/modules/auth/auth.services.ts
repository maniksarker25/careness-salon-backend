/* eslint-disable no-unused-vars */
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../../config';
import AppError from '../../error/appError';
import resetPasswordEmailBody from '../../mailTemplete/resetPasswordEmailBody';
import { getOtpExpiryDate } from '../../utilities/otp';
import sendEmail from '../../utilities/sendEmail';
import Client from '../client/client.model';
import Customer from '../customer/customer.model';
import { upsertDevice } from '../device/device.service';
import SuperAdmin from '../superAdmin/superAdmin.model';
import { USER_ROLE } from '../user/user.constant';
import { TUser, TUserRole } from '../user/user.interface';
import { User } from '../user/user.model';
import { createToken, verifyToken } from '../user/user.utils';
import { ILoginWithGoogle, TLoginUser } from './auth.interface';

const generateVerifyCode = (): number => {
  return crypto.randomInt(1000, 10000);
};
const loginUserIntoDB = async (payload: TLoginUser) => {
  console.log('loginPayload', payload);
  const user = await User.findOne({ email: payload.email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
  }
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is already deleted');
  }
  if (user.status === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
  }
  if (!user.isActive && user.role === USER_ROLE.admin) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Super admin blocked your access',
    );
  }
  if (!user.isVerified) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not verified user . Please verify your email',
    );
  }
  // checking if the password is correct ----
  if (!(await User.isPasswordMatched(payload?.password, user?.password))) {
    throw new AppError(httpStatus.FORBIDDEN, 'Password do not match');
  }

  let profileId = '';
  if (user.role === USER_ROLE.customer) {
    const customer = await Customer.findOne({ user: user._id }).select('_id');
    if (!customer) {
      throw new AppError(httpStatus.NOT_FOUND, 'Customer profile not found');
    }
    profileId = customer._id.toString();
  } else if (user.role == USER_ROLE.client) {
    const client = await Client.findOne({ user: user._id }).select('_id');
    if (!client) {
      throw new AppError(httpStatus.NOT_FOUND, 'Client profile not found');
    }
    profileId = client._id.toString();
  } else {
    const superAdmin = await SuperAdmin.findOne({ user: user._id }).select(
      '_id',
    );
    if (!superAdmin) {
      throw new AppError(httpStatus.NOT_FOUND, 'Super Admin profile not found');
    }
    profileId = superAdmin._id.toString();
  }

  const platform = payload?.platform ? payload?.platform : 'android';

  // device register (IMPORTANT)
  if (payload.playerId) {
    await upsertDevice(profileId, payload.playerId, platform);
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

const loginWithGoogle = async (payload: ILoginWithGoogle) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if the user already exists
    const isExistUser = await User.findOne(
      { email: payload.email },
      { isVerified: true },
    ).session(session);

    // If user exists, create JWT and return tokens
    if (isExistUser) {
      const jwtPayload = {
        id: isExistUser._id,
        email: isExistUser.email,
        role: isExistUser.role as TUserRole,
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

      await session.commitTransaction();
      session.endSession();
      return { accessToken, refreshToken };
    }

    // If user doesn't exist, create a new user
    const userDataPayload: Partial<TUser> = {
      email: payload.email,
      role: USER_ROLE.customer,
      isVerified: true,
    };

    const createUser = await User.create([userDataPayload], { session });

    const customerData = {
      name: payload.name,
      email: payload.email,
      profile_image: payload.profile_image,
      user: createUser[0]._id,
    };

    await Customer.create([customerData], {
      session,
    });

    // Create JWT tokens
    const jwtPayload = {
      id: createUser[0]._id,
      email: createUser[0].email,
      role: createUser[0].role as TUserRole,
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

    await session.commitTransaction();
    session.endSession();

    return { accessToken, refreshToken };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// change password
const changePasswordIntoDB = async (
  userData: JwtPayload,
  payload: {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  },
) => {
  if (payload.newPassword !== payload.confirmNewPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Password and confirm password doesn't match",
    );
  }
  const user = await User.findOne({
    email: userData.email,
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
  }
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is already deleted');
  }
  if (user.status === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
  }

  if (!(await User.isPasswordMatched(payload?.oldPassword, user?.password))) {
    throw new AppError(httpStatus.FORBIDDEN, 'Password do not match');
  }
  //hash new password
  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds),
  );
  await User.findOneAndUpdate(
    {
      _id: userData.id,
      role: userData.role,
    },
    {
      password: newHashedPassword,
      passwordChangedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return null;
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is required');
  }

  const decoded = verifyToken(token, config.jwt_refresh_secret as string);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { username, email, iat } = decoded;

  const user = await User.findOne({
    $or: [{ email: email }, { username: username }],
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
  }
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is already deleted');
  }
  if (user.status === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
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
  return { accessToken };
};

// forgot password
const forgetPassword = async (email: string) => {
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
  }
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is already deleted');
  }
  if (user.status === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
  }

  const resetCode = generateVerifyCode();
  await User.findOneAndUpdate(
    { email: email },
    {
      resetCode: resetCode,
      isResetVerified: false,
      codeExpireIn: getOtpExpiryDate(),
    },
  );
  sendEmail({
    email: user.email,
    subject: 'Reset password code',
    html: resetPasswordEmailBody('Dear', resetCode),
  });

  return null;
};

// verify forgot otp

const verifyResetOtp = async (email: string, resetCode: number) => {
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
  }
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is already deleted');
  }
  if (user.status === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
  }

  if (!user.codeExpireIn || user.codeExpireIn < new Date(Date.now())) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Reset code is expire');
  }
  if (user.resetCode !== Number(resetCode)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Reset code is invalid');
  }
  await User.findOneAndUpdate(
    { email: email },
    { isResetVerified: true },
    { new: true, runValidators: true },
  );
  return null;
};

// reset password
const resetPassword = async (payload: {
  email: string;
  password: string;
  confirmPassword: string;
}) => {
  if (payload.password !== payload.confirmPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Password and confirm password doesn't match",
    );
  }
  const user = await User.findOne({ email: payload.email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
  }

  if (!user.codeExpireIn || user.codeExpireIn < new Date(Date.now())) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Forgot password first then set new password',
    );
  }

  if (!user.isResetVerified) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You need to verify reset code before reset password',
    );
  }

  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is already deleted');
  }
  if (user.status === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
  }
  // verify token -------------
  // const decoded = jwt.verify(
  //   token,
  //   config.jwt_access_secret as string,
  // ) as JwtPayload;
  // // console.log(decoded.userId, payload.id);
  // if (decoded?.userId !== payload?.email) {
  //   throw new AppError(
  //     httpStatus.FORBIDDEN,
  //     'You are forbidden to access this',
  //   );
  // }

  //hash new password
  const newHashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds),
  );
  // update the new password
  await User.findOneAndUpdate(
    {
      email: payload.email,
    },
    {
      password: newHashedPassword,
      passwordChangedAt: new Date(),
      isResetVerified: false,
      resetCode: null,
      codeExpireIn: null,
    },
  );
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

  return { accessToken, refreshToken };
};

const resendResetCode = async (email: string) => {
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
  }
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is already deleted');
  }
  if (user.status === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
  }

  const resetCode = generateVerifyCode();
  await User.findOneAndUpdate(
    { email: email },
    {
      resetCode: resetCode,
      isResetVerified: false,
      codeExpireIn: getOtpExpiryDate(),
    },
  );
  sendEmail({
    email: user.email,
    subject: 'Reset password code',
    html: resetPasswordEmailBody('Dear', resetCode),
  });

  return null;
};

const authServices = {
  loginUserIntoDB,
  changePasswordIntoDB,
  refreshToken,
  forgetPassword,
  resetPassword,
  verifyResetOtp,
  resendResetCode,
  loginWithGoogle,
};

export default authServices;
