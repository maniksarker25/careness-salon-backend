import { REVENUE_BOOKING_MATCH } from '../booking/booking.revenue';
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/appError';
import Booking from '../booking/booking.model';
import Category from '../category/category.model';
import Client from '../client/client.model';
import IService from './service.interface';
import Service from './service.model';

const createService = async (shopId: string, payload: IService) => {
  const isCategoryExist = await Category.findById(payload.category);
  if (!isCategoryExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not exits');
  }
  const shop = await Client.findById(shopId);
  const result = await Service.create({
    ...payload,
    shop: shopId,
    shopCategory: shop.shopCategoryId,
  });
  return result;
};

const getAllService = async (query: Record<string, any>) => {
  // Step 1: Aggregate total sales for each service
  const totalSales = await Booking.aggregate([
    { $match: REVENUE_BOOKING_MATCH }, // only earned revenue
    { $unwind: '$services' }, // Unwind services array in each booking
    {
      $group: {
        _id: '$services.serviceId',
        totalSales: { $sum: '$services.price' },
      },
    },
  ]);

  // Step 2: Create a mapping for quick lookup of total sales by serviceId
  const salesMap = totalSales.reduce(
    (acc, sale) => {
      acc[sale._id.toString()] = sale.totalSales;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Step 3: Build the service query with pagination, search, etc.
  const serviceQuery = new QueryBuilder(
    Service.find().populate({ path: 'shop', select: 'shopName' }),
    query,
  )
    .search(['serviceName'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await serviceQuery.countTotal();
  const result = await serviceQuery.modelQuery;

  // Step 4: Add totalSales to each service in the result
  const resultWithSales = result.map((service) => {
    const serviceId = service._id.toString();
    return {
      ...service.toObject(),
      totalSales: salesMap[serviceId] || 0, // Add totalSales, defaulting to 0 if not found
    };
  });

  // Step 5: Sort by totalSales if requested
  if (query.sort === 'topSelling') {
    resultWithSales.sort((a, b) => b.totalSales - a.totalSales); // Sort descending by totalSales
  }

  return {
    meta,
    result: resultWithSales,
  };
};

const updateService = async (id: string, payload: Partial<IService>) => {
  if (payload.category) {
    const isCategoryExist = await Category.findById(payload.category);
    if (!isCategoryExist) {
      throw new AppError(httpStatus.NOT_FOUND, 'Category not exits');
    }
  }
  const service = await Service.findById(id);
  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  }
  const result = await Service.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const deleteService = async (id: string) => {
  const result = await Service.findByIdAndDelete(id);
  return result;
};

const getMyServices = async (shopId: string) => {
  const categories = await Category.find({ shop: shopId })
    .select('categoryName appointmentColor')
    .exec();

  const categoriesWithServices = await Promise.all(
    categories.map(async (category) => {
      const services = await Service.find({ category: category._id })
        .select('serviceName availableFor durationMinutes price')
        .exec();

      return {
        ...category.toObject(),
        services: services,
      };
    }),
  );

  return categoriesWithServices;
};

const getSingleService = async (id: string) => {
  const service = await Service.findById(id).populate(
    'category',
    'appointmentColor categoryName',
  );
  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  }

  return service;
};

const ServiceService = {
  createService,
  updateService,
  deleteService,
  getAllService,
  getMyServices,
  getSingleService,
};

export default ServiceService;
