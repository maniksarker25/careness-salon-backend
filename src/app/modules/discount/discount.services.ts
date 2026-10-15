/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { IDiscount } from './discount.interface';
import Discount from './discount.model';
import { Types } from 'mongoose';
import Service from '../service/service.model';

const createDiscount = async (shopId: string, payload: IDiscount) => {
  const discount = await Discount.findOne({ shop: shopId });

  if (discount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You already have a discount schedule',
    );
  }

  const result = await Discount.create({ ...payload, shop: shopId });

  return result;
};

const getDiscount = async (shopId: string) => {
  const discount = await Discount.findOne({ shop: shopId }).exec();
  console.log('discount', discount);
  if (!discount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Your don't have any discount schedule",
    );
  }

  // if (discount.products !== 'all-products') {
  //   // Ensure TypeScript understands that product IDs are of type ObjectId
  //   const products = await Promise.all(
  //     discount.products.map((productId: Types.ObjectId) =>
  //       Product.findById(productId),
  //     ),
  //   );
  //   //   discount.products = products;
  //   discount.products = products.filter(
  //     (product): product is NonNullable<typeof product> => product !== null,
  //   ) as any;
  // }
  if (discount.services !== 'all-services') {
    const products = await Promise.all(
      discount.services.map((serviceId: Types.ObjectId) =>
        Service.findById(serviceId).select('serviceName'),
      ),
    );
    //   discount.products  = products;
    discount.services = products.filter(
      (service): service is NonNullable<typeof service> => service !== null,
    ) as any;
  }

  return discount;
};
const updateDiscount = async (shopId: string, payload: Partial<IDiscount>) => {
  const discount = await Discount.findOne({ shop: shopId });

  if (!discount) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "You don't have any discount schedule",
    );
  }
  const result = await Discount.findOneAndUpdate({ shop: shopId }, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const deleteDiscount = async (shopId: string) => {
  const result = await Discount.findOneAndDelete({ shop: shopId });
  return result;
};

const DiscountService = {
  createDiscount,
  getDiscount,
  updateDiscount,
  deleteDiscount,
};

export default DiscountService;
