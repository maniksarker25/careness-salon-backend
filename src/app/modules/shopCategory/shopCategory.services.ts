import { REVENUE_BOOKING_MATCH } from '../booking/booking.revenue';
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { IShopCategory } from './shopCategory.interface';
import ShopCategory from './shopCategory.model';
import QueryBuilder from '../../builder/QueryBuilder';
import Service from '../service/service.model';
import Booking from '../booking/booking.model';

const createShopCategory = async (payload: IShopCategory) => {
  const result = await ShopCategory.create(payload);

  return result;
};

const updateShopCategory = async (
  id: string,
  payload: Partial<IShopCategory>,
) => {
  const isExist = await ShopCategory.findById(id);
  if (!isExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop Category not found');
  }

  const result = await ShopCategory.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

const deleteShopCategory = async (id: string) => {
  const result = await ShopCategory.findByIdAndDelete(id);
  return result;
};

const getAllShopCategory = async (query: Record<string, any>) => {
  const shopCategoryQuery = new QueryBuilder(ShopCategory.find(), query)
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await shopCategoryQuery.countTotal();

  // Step 1: Fetch filtered shop categories
  const shopCategories = await shopCategoryQuery.modelQuery;

  // Step 2: Aggregate total service count and sales
  const shopCategoryIds = shopCategories.map((category: any) => category._id);

  // Aggregate total services count for each shop category
  const serviceCounts = await Service.aggregate([
    { $match: { shopCategory: { $in: shopCategoryIds } } },
    {
      $group: {
        _id: '$shopCategory',
        totalServices: { $sum: 1 },
      },
    },
  ]);

  // Aggregate total sales for each shop category
  const salesData = await Booking.aggregate([
    {
      $match: {
        shopCategoryId: { $in: shopCategoryIds },
        ...REVENUE_BOOKING_MATCH,
      },
    },
    {
      $unwind: '$services',
    },
    {
      $group: {
        _id: '$shopCategoryId',
        totalSales: { $sum: '$services.price' },
      },
    },
  ]);

  // Step 3: Map data back to the shop categories
  const serviceCountsMap = Object.fromEntries(
    serviceCounts.map((item) => [item._id.toString(), item.totalServices]),
  );
  const salesDataMap = Object.fromEntries(
    salesData.map((item) => [item._id.toString(), item.totalSales]),
  );

  const result = shopCategories.map((category: any) => ({
    ...category.toObject(),
    totalServices: serviceCountsMap[category._id.toString()] || 0,
    totalSales: salesDataMap[category._id.toString()] || 0,
  }));

  return {
    meta,
    result,
  };
};

const ShopCategoryServices = {
  createShopCategory,
  updateShopCategory,
  deleteShopCategory,
  getAllShopCategory,
};

export default ShopCategoryServices;
