import { REVENUE_BOOKING_MATCH } from '../booking/booking.revenue';
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import QueryBuilder from '../../builder/QueryBuilder';
import config from '../../config';
import { customerSpeed, maxDistanceForShop } from '../../constant';
import { appEventEmitter } from '../../events/eventEmitter';
import AppError from '../../error/appError';
import getCurrentDay from '../../helper/getCurrentDay';
import {
  ENUM_NOTIFICATION_TYPE,
  ENUM_PAYMENT_PURPOSE,
} from '../../utilities/enum';
import Booking from '../booking/booking.model';
import BusinessHour from '../bussinessHour/businessHour.model';
import Category from '../category/category.model';
import Discount from '../discount/discount.model';
import Service from '../service/service.model';
import ShopCategory from '../shopCategory/shopCategory.model';
import { User } from '../user/user.model';
import { IClient, TUpdateClientProfilePayload } from './client.interface';
import Client from './client.model';
const stripe = new Stripe(config.stripe.stripe_secret_key as string);
const toStripeAmount = (amount: number) => Math.round(amount * 100);
const updateClientProfile = async (
  userId: string,
  payload: TUpdateClientProfilePayload,
) => {
  const { deleteImages = [], newShopImages, ...profileUpdates } = payload;
  const updatePayload: Partial<IClient> = profileUpdates;

  if (deleteImages.length > 0 || (newShopImages?.length ?? 0) > 0) {
    const client = await Client.findOne({ user: userId }).select('shopImages');
    if (!client) {
      throw new AppError(httpStatus.NOT_FOUND, 'Client not found');
    }

    updatePayload.shopImages = [
      ...(client.shopImages || []).filter(
        (image: string) => !deleteImages.includes(image),
      ),
      ...(newShopImages || []),
    ];
  }

  const result = await Client.findOneAndUpdate({ user: userId }, updatePayload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const addShopDetails = async (id: string, payload: Partial<IClient>) => {
  const shop = await Client.findById(id);
  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  const isCategoryExist = await ShopCategory.findOne({
    categoryName: payload.shopCategory,
  });
  if (!isCategoryExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop category not found');
  }

  const result = await Client.findByIdAndUpdate(
    id,
    { ...payload, isShopInfoProvided: true },
    {
      new: true,
      runValidators: true,
    },
  );

  return result;
};

const addBankDetails = async (id: string, payload: Partial<IClient>) => {
  const shop = await await Client.findById(id);

  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }
  const result = await Client.findByIdAndUpdate(
    id,
    { ...payload, isProfileCompleted: true },
    { new: true, runValidators: true },
  );
  const notificationData = {
    title: 'New Shop Register!',
    message: `A new shop is registered named ${shop.shopName}`,
    receiver: 'admin',
  };
  appEventEmitter.emit('shop.registered', notificationData);
  return result;
};
const getAllClientFromDB = async (query: Record<string, any>) => {
  const totalSales = await Booking.aggregate([
    { $match: REVENUE_BOOKING_MATCH },
    {
      $group: {
        _id: '$shopId',
        totalSales: { $sum: '$totalPrice' },
      },
    },
  ]);

  // Create a mapping for quick lookup of total sales by shopId
  const salesMap = totalSales.reduce(
    (acc, sale) => {
      acc[sale._id.toString()] = sale.totalSales;
      return acc;
    },
    {} as Record<string, number>,
  );

  //Build the client query with pagination, search, etc.
  const ClientQuery = new QueryBuilder(
    Client.find().select(
      'shopName shopImages totalRating totalRatingCount phoneNumber email location status city user',
    ),
    query,
  )
    .search(['shopName'])
    .fields()
    .filter()
    .paginate()
    .sort();

  const meta = await ClientQuery.countTotal();
  const clients = await ClientQuery.modelQuery;

  const clientIds = clients.map((client) => client._id);
  const now = new Date();
  const activeDiscounts = await Discount.find({
    shop: { $in: clientIds },
    discountStartDate: { $lte: now },
    discountEndDate: { $gte: now },
  }).select('shop discountPercentage');

  const discountMap = activeDiscounts.reduce(
    (acc, discount) => {
      acc[discount.shop.toString()] = discount.discountPercentage;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Add totalSales to each client in the result
  const clientsWithSales = clients.map((client) => {
    const clientId = client._id.toString();
    return {
      ...client.toObject(),
      totalSales: salesMap[clientId] || 0,
      discountPercentage: discountMap[clientId] || 0,
    };
  });

  if (query.sort === 'topSelling') {
    clientsWithSales.sort((a, b) => b.totalSales - a.totalSales);
  }

  return {
    meta,
    result: clientsWithSales,
  };
};

const updateClientStatus = async (id: string, status: string) => {
  const client = await Client.findById(id);
  if (!client) {
    throw new AppError(httpStatus.NOT_FOUND, 'Client not found');
  }
  const session = await Client.startSession();
  session.startTransaction();

  try {
    const result = await Client.findByIdAndUpdate(
      id,
      { status: status },
      { runValidators: true, new: true, session: session },
    );

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Client not found');
    }

    const isActive = status === 'active';

    const updateUser = await User.findOneAndUpdate(
      { _id: result.user },
      { isActive: isActive },
      { runValidators: true, new: true, session: session },
    );
    const notificationData = {
      title: isActive ? 'Activate shop' : 'Deactivate shop',
      type: ENUM_NOTIFICATION_TYPE.GENERAL,
      message: isActive
        ? 'Congratulations admin approved your shop.Please connect your bank information for receive payments'
        : 'An Admin deactivate your shop , please contact with support',
      receiver: result._id,
    };
    if (!updateUser) {
      throw new AppError(httpStatus.FAILED_DEPENDENCY, 'User not updated');
    }
    appEventEmitter.emit('shop.status.changed', {
      ...notificationData,
      receiver: result._id.toString(),
      meta: { status },
    });
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

const getNearbyShopWithTime = async (
  customerId: string | undefined,
  query: Record<string, any>,
) => {
  const pipeline: any[] = [];

  // ✅ Validate customerId
  const isValidCustomerId =
    customerId && mongoose.Types.ObjectId.isValid(customerId);

  // ✅ GEO (must be first)
  if (query.latitude && query.longitude) {
    pipeline.push({
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [
            parseFloat(query.longitude),
            parseFloat(query.latitude),
          ],
        },
        distanceField: 'distance',
        maxDistance: maxDistanceForShop,
        spherical: true,
      },
    });
  }

  // ✅ Filters
  const matchStage: any = {
    status: 'active',
  };

  if (query.shopName) {
    matchStage.shopName = { $regex: query.shopName, $options: 'i' };
  }

  if (query.shopGenderCategory) {
    matchStage.shopGenderCategory = query.shopGenderCategory;
  }

  if (query.shopCategoryId) {
    matchStage.shopCategoryId = new mongoose.Types.ObjectId(
      query.shopCategoryId,
    );
  }

  pipeline.push({ $match: matchStage });

  // ✅ Estimated Time
  pipeline.push({
    $addFields: {
      estimatedTime: {
        $cond: {
          if: { $gt: ['$distance', 0] },
          then: { $divide: ['$distance', customerSpeed] },
          else: null,
        },
      },
    },
  });

  // ✅ Top Rated
  if (query.topRated) {
    pipeline.push({
      $addFields: {
        ratingRatio: {
          $cond: {
            if: { $eq: [{ $ifNull: ['$totalRatingCount', 0] }, 0] },
            then: 0,
            else: { $divide: ['$totalRating', '$totalRatingCount'] },
          },
        },
      },
    });

    pipeline.push({
      $sort: { ratingRatio: -1 },
    });
  } else if (query.latitude && query.longitude) {
    // ✅ default sort by distance
    pipeline.push({
      $sort: { distance: 1 },
    });
  }

  // ✅ Bookmark logic (ONLY if logged in)
  if (isValidCustomerId) {
    pipeline.push({
      $lookup: {
        from: 'shopbookmarks',
        let: { shopId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$shop', '$$shopId'] },
                  {
                    $eq: [
                      '$costumer', // ✅ FIXED HERE
                      new mongoose.Types.ObjectId(customerId),
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: 'bookmarkData',
      },
    });

    pipeline.push({
      $addFields: {
        isBookmark: { $gt: [{ $size: '$bookmarkData' }, 0] },
      },
    });
  } else {
    // ✅ Not logged in
    pipeline.push({
      $addFields: {
        isBookmark: false,
      },
    });
  }

  // ✅ Final projection
  pipeline.push({
    $project: {
      shopName: 1,
      shopCategoryId: 1,
      distance: 1,
      estimatedTime: 1,
      isBookmark: 1,
      shopImages: 1,
      location: 1,
      totalRating: 1,
      totalRatingCount: 1,
      shopGenderCategory: 1,
      address: 1,
    },
  });

  const result = await Client.aggregate(pipeline);

  const shopIds = result.map((shop) => shop._id);
  const now = new Date();
  const activeDiscounts = await Discount.find({
    shop: { $in: shopIds },
    discountStartDate: { $lte: now },
    discountEndDate: { $gte: now },
  }).select('shop discountPercentage');

  const discountMap = activeDiscounts.reduce(
    (acc, discount) => {
      acc[discount.shop.toString()] = discount.discountPercentage;
      return acc;
    },
    {} as Record<string, number>,
  );

  return result.map((shop) => ({
    ...shop,
    discountPercentage: discountMap[shop._id.toString()] || 0,
  }));
};
const getSingleShop = async (id: string) => {
  const currentDay = getCurrentDay();
  const now = new Date();

  // Fetch business hours for the current day
  const businessHour = await BusinessHour.findOne({
    entityId: id,
    entityType: 'Shop',
    day: currentDay,
  }).select('day openTime closeTime isClosed');

  // Find the client/shop by ID and populate the shopCategoryId
  const shop = await Client.findById(id)
    .populate('shopCategoryId')
    .select(
      'shopImages shopName location totalRating totalRatingCount _id shopGenderCategory user',
    );

  // Check if the shop was found
  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  // Fetch categories related to the shop's ID
  const categories = await Category.find({ shop: shop._id })
    .select('categoryName appointmentColor')
    .exec();

  // Check for an active discount
  const discount = await Discount.findOne({
    shop: id,
    discountStartDate: { $lte: now },
    discountEndDate: { $gte: now },
  });

  const isAllServicesDiscounted = discount?.services === 'all-services';
  const categoriesWithServices = await Promise.all(
    categories.map(async (category) => {
      const services = await Service.find({ category: category._id })
        .select('serviceName availableFor durationMinutes price')
        .exec();
      const servicesWithDiscount = services.map((service) => {
        const isServiceDiscounted =
          isAllServicesDiscounted ||
          (discount?.services instanceof Array &&
            discount.services.some(
              (id: any) => id.toString() === service._id.toString(),
            ));

        if (isServiceDiscounted) {
          const discountAmount =
            service.price * (discount.discountPercentage / 100);
          const discountPrice = service.price - discountAmount;
          return {
            ...service.toObject(),
            discountPrice: discountPrice,
          };
        }

        return service.toObject();
      });

      return {
        ...category.toObject(),
        services: servicesWithDiscount,
      };
    }),
  );

  // Format the response as required
  return {
    ...shop.toObject(),
    categories: categoriesWithServices,
    businessHour,
  };
};

const getShopDetails = async (id: string) => {
  const shop = await Client.findById(id);
  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  return shop;
};

const getPayOnShopData = async (query: Record<string, unknown>) => {
  const shopQuery = new QueryBuilder(
    Client.find().select('shopName payOnShopChargeDueAmount shopImages '),
    query,
  )
    .search(['shopName'])
    .fields()
    .filter()
    .paginate()
    .sort();

  const meta = await shopQuery.countTotal();
  const result = await shopQuery.modelQuery;

  return { meta, result };
};

const payAdminFee = async (profileId: string, payload: any) => {
  if (payload?.paymentMethod && payload.paymentMethod !== 'stripe') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Only Stripe payments are supported',
    );
  }

  return payAdminFeeWithStripe(profileId);
};

// pay admin fee with stripe------------------------------

const payAdminFeeWithStripe = async (shopId: string) => {
  const shop = await Client.findById(shopId).select(
    'payOnShopChargeDueAmount _id',
  );
  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }
  if (shop.payOnShopChargeDueAmount < 10) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can't payment for less then 10",
    );
  }
  const amountInCents = toStripeAmount(shop.payOnShopChargeDueAmount);
  console.log('shop id', shop._id);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Admin fee`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      shopId: shop._id.toString(),
      paymentPurpose: ENUM_PAYMENT_PURPOSE.ADMIN_FEE,
    },
    success_url: `${config.stripe.admin_fee_payment_success_url}`,
    cancel_url: `${config.stripe.payment_cancel_url}`,
  });

  return { url: session.url };
};

// notify shops for admin fee
const notifyAllShopsForAdminFee = async () => {
  const shops = await Client.find({
    payOnShopChargeDueAmount: { $gt: 100 },
    isDeleted: false,
    status: 'active',
  });

  if (!shops.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Shops not found who have admin fee more then 100 eur',
    );
  }

  for (const shop of shops) {
    appEventEmitter.emit('admin-fee.alert', {
      title: 'Admin Fee Alert',
      message: `Dear ${shop.shopName}, your current due charge is ${shop.payOnShopChargeDueAmount}. Please clear it to avoid penalties.`,
      receiver: shop.user.toString(),
      type: ENUM_NOTIFICATION_TYPE.GENERAL,
      meta: {
        dueAmount: shop.payOnShopChargeDueAmount,
      },
    });
    console.log(`Notification sent to shop: ${shop.shopName}`);
  }
};

const notifySingleShopsForAdminFee = async (shopId: string) => {
  const shop = await Client.findById(shopId);
  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }
  const notificationData = {
    title: 'Admin Fee Alert',
    message: `Dear ${shop.shopName}, your current due charge is ${shop.payOnShopChargeDueAmount}. Please clear it to avoid penalties.`,
    seen: false,
    receiver: shop.user.toString(),
    type: ENUM_NOTIFICATION_TYPE.GENERAL,
  };

  appEventEmitter.emit('admin-fee.alert', notificationData);
  console.log(`Notification sent to shop: ${shop.shopName}`);
};

const deleteClient = async (id: string) => {
  const client = await Client.findById(id);
  if (!client) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  const result = await Client.findByIdAndDelete(id);
  await User.findByIdAndDelete(client.user);
  return result;
};

const ClientServices = {
  updateClientProfile,
  getAllClientFromDB,
  updateClientStatus,
  getNearbyShopWithTime,
  getSingleShop,
  addShopDetails,
  addBankDetails,
  getShopDetails,
  getPayOnShopData,
  payAdminFee,
  notifyAllShopsForAdminFee,
  notifySingleShopsForAdminFee,
  deleteClient,
};

export default ClientServices;
