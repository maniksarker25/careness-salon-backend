import httpStatus from 'http-status';
import AppError from '../error/appError';
import { User } from '../modules/user/user.model';
import { USER_ROLE } from '../modules/user/user.constant';
import Customer from '../modules/customer/customer.model';
import Client from '../modules/client/client.model';

const getUserDetails = async (id: string) => {
  try {
    if (!id) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Id not found');
    }
    const user = await User.findOne({ _id: id }).select('-password');
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found 1');
    }
    console.log('user user user====================>', user);
    let userDetails;
    if (user.role == USER_ROLE.customer) {
      userDetails = await Customer.findOne({ user: user._id }).select(
        'firstName lastName profile_image user ',
      );
    } else if (user?.role == USER_ROLE.client) {
      userDetails = await Client.findOne({ user: user._id }).select(
        'shopName shopImages user',
      );
    }
    return userDetails;
  } catch (error) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No user found');
  }
};

export default getUserDetails;
