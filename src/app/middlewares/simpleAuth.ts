import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import Admin from '../modules/admin/admin.model';
import Client from '../modules/client/client.model';
import Customer from '../modules/customer/customer.model';
import SuperAdmin from '../modules/superAdmin/superAdmin.model';
import { USER_ROLE } from '../modules/user/user.constant';
import catchAsync from '../utilities/catchasync';

const getTokenFromHeader = (authorization?: string) => {
  if (!authorization) {
    return undefined;
  }

  const [scheme, token] = authorization.split(' ');
  return /^bearer$/i.test(scheme) && token ? token : authorization;
};

const simpleAuth = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = getTokenFromHeader(req.headers.authorization);

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(
      token,
      config.jwt_access_secret as string,
    ) as JwtPayload;
    const { id, role } = decoded;
    let profileData;
    if (role === USER_ROLE.customer) {
      profileData = await Customer.findOne({ user: id }).select('_id');
    } else if (role === USER_ROLE.client) {
      profileData = await Client.findOne({ user: id }).select('_id');
    } else if (role === USER_ROLE.admin) {
      profileData = await Admin.findOne({ user: id }).select('_id');
    } else if (role === USER_ROLE.superAdmin) {
      profileData = await SuperAdmin.findOne({ user: id }).select('_id');
    }

    decoded.profileId = profileData?._id;
    req.user = decoded;
    next();
  },
);

export default simpleAuth;
