/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/appError';
import Customer from './customer.model';
import { User } from '../user/user.model';
import { UserStatus } from '../user/user.constant';
import { ICompleteCustomer, ICustomer } from './customer.interface';

//!TODO: need to get total speeding for this customer ----
const getAllCustomer = async (query: Record<string, any>) => {
  // `status` lives on the User document, not on Customer, so translate it
  // into a filter on the linked user ids instead of passing it through.
  const { status, ...restQuery } = query;
  const baseFilter: Record<string, any> = {};
  if (status) {
    if (!UserStatus.includes(status)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid status. Use one of: ${UserStatus.join(', ')}`,
      );
    }
    const userIds = await User.find({ status }).distinct('_id');
    baseFilter.user = { $in: userIds };
  }

  const customerQuery = new QueryBuilder(
    Customer.find(baseFilter).populate({ path: 'user', select: 'status' }),
    restQuery,
  )
    .search(['firstName', 'lastName', 'email'])
    .filter()
    .sort()
    .paginate()
    .fields();
  const meta = await customerQuery.countTotal();
  const result = await customerQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const updateCustomerProfile = async (
  profileId: string,
  payload: Partial<ICustomer>,
) => {
  const customer = await Customer.findById(profileId);

  if (!customer) {
    throw new AppError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const result = await Customer.findByIdAndUpdate(profileId, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

const completeCustomerProfile = async (
  id: string,
  payload: ICompleteCustomer,
) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new AppError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const result = await Customer.findByIdAndUpdate(
    id,
    { ...payload, isProfileComplete: true },
    {
      new: true,
      runValidators: true,
    },
  );

  return result;
};

const customerServices = {
  getAllCustomer,
  updateCustomerProfile,
  completeCustomerProfile,
};

export default customerServices;
