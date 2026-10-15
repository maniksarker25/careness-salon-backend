import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utilities/catchasync';
import AppError from '../error/appError';
import httpStatus from 'http-status';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import { TUserRole } from '../modules/user/user.interface';
import { User } from '../modules/user/user.model';
import { USER_ROLE } from '../modules/user/user.constant';
import Customer from '../modules/customer/customer.model';
import Client from '../modules/client/client.model';
import Admin from '../modules/admin/admin.model';

// make costume interface
const getTokenFromHeader = (authorization?: string) => {
  if (!authorization) {
    return undefined;
  }

  const [scheme, token] = authorization.split(' ');
  return /^bearer$/i.test(scheme) && token ? token : authorization;
};

const authWithoutActive = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // check if the token is sent from client -----
    const token = getTokenFromHeader(req?.headers?.authorization);
    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Your are not authorized 1');
    }
    // check if the token is valid-
    // checking if the given token is valid

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        config.jwt_access_secret as string,
      ) as JwtPayload;
    } catch (err) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Token is expired');
    }
    const { id, role, email, iat } = decoded;

    if (!decoded) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Token is expired');
    }
    // get the user if that here ---------

    const user = await User.isUserExists(email);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
      throw new AppError(httpStatus.FORBIDDEN, 'This user is already deleted');
    }
    if (user.status === 'blocked') {
      throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }

    let profileData;
    if (role === USER_ROLE.customer) {
      profileData = await Customer.findOne({ user: id }).select('_id');
    } else if (role === USER_ROLE.client) {
      profileData = await Client.findOne({ user: id }).select('_id');
    } else if (role === USER_ROLE.admin) {
      profileData = await Admin.findOne({ user: id }).select('_id');
    }

    decoded.profileId = profileData?._id;
    if (
      user?.passwordChangedAt &&
      (await User.isJWTIssuedBeforePasswordChange(
        user?.passwordChangedAt,
        iat as number,
      ))
    ) {
      throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized 2');
    }
    if (requiredRoles.length && !requiredRoles.includes(role)) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Your are not authorized 3');
    }
    // add those properties in req
    req.user = decoded as JwtPayload;
    next();
  });
};

export default authWithoutActive;
