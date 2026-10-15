/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import httpStatus from 'http-status';
import cron from 'node-cron';
import AppError from '../../error/appError';
import calculateTotalServiceTime from '../../helper/calculateTotalServiceTime';
import BlockHour from '../blockHour/blockHour.model';
import Discount from '../discount/discount.model';
import Service from '../service/service.model';
import Booking from './booking.model';

import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import QueryBuilder from '../../builder/QueryBuilder';
import config from '../../config';
import { payonShopChargePerBooking } from '../../constant';
import { appEventEmitter } from '../../events/eventEmitter';
import emitNewBookingNotification from '../../helper/emitNewBookingNotification';
import { getStripeAccountReadiness } from '../../helper/isAccountReady';
import {
  ENUM_BOOKING_STATUS,
  ENUM_NOTIFICATION_TYPE,
  ENUM_PAYMENT_METHOD,
  ENUM_PAYMENT_PURPOSE,
  ENUM_PAYMENT_TYPE,
} from '../../utilities/enum';
import Client from '../client/client.model';
import Customer from '../customer/customer.model';
import Notification from '../notification/notification.model';
import Transaction from '../transaction/transaction.model';
import { USER_ROLE } from '../user/user.constant';
import {
  DATE_ONLY_REGEX,
  endOfSalon,
  endOfSalonYear,
  formatSalonDate,
  formatSalonTime,
  getSalonWeekday,
  startOfSalon,
  startOfSalonYear,
  toSalonDateTime,
} from '../../utilities/salonTime';
import { REVENUE_BOOKING_MATCH } from './booking.revenue';
import { assertWithinBusinessHours } from '../bussinessHour/businessHour.utils';
const stripe = new Stripe(config.stripe.stripe_secret_key as string);

const toStripeAmount = (amount: number) => Math.round(amount * 100);

const createPayOnShopBooking = async (customerId: string, payload: any) => {
  const { serviceIds, date, startTime, shopId } = payload;
  const shop = await Client.findById(shopId);
  if (!shop) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Shop not found');
  }

  const now = new Date();
  const discount = await Discount.findOne({
    shop: shopId,
    discountStartDate: { $lte: now },
    discountEndDate: { $gte: now },
  });

  const servicesWithPrices = await Promise.all(
    serviceIds.map(async (serviceId: string) => {
      const service = await Service.findById(serviceId).select('price');
      if (!service) throw new Error(`Service with ID ${serviceId} not found`);

      // Check if discount applies to this service
      let isServiceDiscounted = false;
      if (discount) {
        if (discount.services === 'all-services') {
          isServiceDiscounted = true;
        } else if (Array.isArray(discount.services)) {
          isServiceDiscounted = discount.services.some(
            (id: any) => id.toString() === service._id.toString(),
          );
        }
      }

      // Calculate discount price if discount applies
      const price = isServiceDiscounted
        ? service.price - (service.price * discount!.discountPercentage) / 100
        : service.price;

      return { serviceId: service._id, price };
    }),
  );

  const totalPrice = servicesWithPrices.reduce(
    (total, service) => total + service.price,
    0,
  );

  const totalDuration = await calculateTotalServiceTime(serviceIds);

  // Create the start date as the correct UTC instant for this local (salon
  // timezone) date + time, so it matches the slots shown to the customer.
  const startDate = toSalonDateTime(date, startTime);

  // Create the end date based on total duration
  const endDate = new Date(startDate);
  endDate.setMinutes(startDate.getMinutes() + totalDuration);

  // Reject closed days and times outside the shop's / staff member's hours.
  await assertWithinBusinessHours({
    shopId,
    staffId: payload.staffId,
    date,
    startDate,
    endDate,
  });

  // Check for conflicting bookings
  const existingBookings = await Booking.find({
    staffId: payload.staffId,
    $and: [{ startTime: { $lt: endDate }, endTime: { $gt: startDate } }],
    status: { $in: [ENUM_BOOKING_STATUS.PENDING, ENUM_BOOKING_STATUS.BOOKED] },
  });

  if (existingBookings.length > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      'The selected time slot is conflict with other booking. Please choose a different time.',
    );
  }

  // Fetch blocked hours for the staff and shop
  const blockHours = await BlockHour.find({
    entityId: payload.staffId,
    entityType: 'Staff',
    day: getSalonWeekday(date),
  });

  const businessBlockHour = await BlockHour.find({
    entityId: shopId,
    entityType: 'Shop',
    day: getSalonWeekday(date),
  });

  // Check if the selected time is within a blocked hour
  const isBlocked = blockHours.some(
    (bh) =>
      formatSalonTime(startDate) >= bh.startTime &&
      formatSalonTime(startDate) < bh.endTime,
  );

  const isBusinessBlocked = businessBlockHour.some(
    (bh) =>
      formatSalonTime(startDate) >= bh.startTime &&
      formatSalonTime(startDate) < bh.endTime,
  );

  if (isBlocked || isBusinessBlocked) {
    throw new Error(
      'The selected time slot is blocked. Please choose a different time.',
    );
  }

  const result = await Booking.create({
    ...payload,
    shopCategoryId: shop.shopCategoryId,
    startTime: startDate,
    endTime: endDate,
    customerId,
    services: servicesWithPrices,
    status: ENUM_BOOKING_STATUS.BOOKED,
    totalPrice,
    totalDuration,
  });

  await Client.findByIdAndUpdate(
    shopId,
    { $inc: { payOnShopChargeDueAmount: payonShopChargePerBooking } },
    { new: true, runValidators: true },
  );

  await emitNewBookingNotification(result);

  return result;
};

const createOnlineBooking = async (customerId: string, payload: any) => {
  const { serviceIds, date, startTime, shopId } = payload;
  const shop = await Client.findById(shopId);
  if (!shop) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Shop not found');
  }

  if (payload.paymentType !== ENUM_PAYMENT_TYPE.ONLINE) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Only online payment type is supported for Stripe checkout',
    );
  }

  const readiness = await getStripeAccountReadiness(shop.stripAccountId);
  if (!readiness.ready) {
    throw new AppError(httpStatus.FORBIDDEN, readiness.message);
  }

  console.log('Stripe account readiness:', readiness);

  const now = new Date();

  // Fetch active discount for the shop once
  const discount = await Discount.findOne({
    shop: shopId,
    discountStartDate: { $lte: now },
    discountEndDate: { $gte: now },
  });

  console.log('Active discount:', discount);

  // Fetch services with their applicable prices-----------------------
  const servicesWithPrices = await Promise.all(
    serviceIds.map(async (serviceId: string) => {
      const service = await Service.findById(serviceId).select('price');
      if (!service) throw new Error(`Service with ID ${serviceId} not found`);

      // Check if discount applies to this service
      let isServiceDiscounted = false;
      if (discount) {
        if (discount.services === 'all-services') {
          isServiceDiscounted = true;
        } else if (Array.isArray(discount.services)) {
          isServiceDiscounted = discount.services.some(
            (id: any) => id.toString() === service._id.toString(),
          );
        }
      }

      const price = isServiceDiscounted
        ? service.price - (service.price * discount!.discountPercentage) / 100
        : service.price;

      return { serviceId: service._id, price };
    }),
  );

  const totalPrice = servicesWithPrices.reduce(
    (total, service) => total + service.price,
    0,
  );

  const totalDuration = await calculateTotalServiceTime(serviceIds);

  // Create the start date as the correct UTC instant for this local (salon
  // timezone) date + time, so it matches the slots shown to the customer.
  const startDate = toSalonDateTime(date, startTime);

  // Create the end date based on total duration
  const endDate = new Date(startDate);
  endDate.setMinutes(startDate.getMinutes() + totalDuration);

  // Reject closed days and times outside the shop's / staff member's hours.
  await assertWithinBusinessHours({
    shopId,
    staffId: payload.staffId,
    date,
    startDate,
    endDate,
  });
  console.log('start', startDate, 'end', endDate);
  // Check for conflicting bookings----------------
  const existingBookings = await Booking.find({
    staffId: payload.staffId,
    $and: [{ startTime: { $lt: endDate }, endTime: { $gt: startDate } }],
    status: { $in: [ENUM_BOOKING_STATUS.PENDING, ENUM_BOOKING_STATUS.BOOKED] },
  });
  //check operation-------------
  if (existingBookings.length > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      'The selected time slot is conflict with other booking. Please choose a different time.',
    );
  }

  // Fetch blocked hours for the staff and shop
  const blockHours = await BlockHour.find({
    entityId: payload.staffId,
    entityType: 'Staff',
    day: getSalonWeekday(date),
  });

  const businessBlockHour = await BlockHour.find({
    entityId: shopId,
    entityType: 'Shop',
    day: getSalonWeekday(date),
  });

  // Check if the selected time is within a blocked hour
  const isBlocked = blockHours.some(
    (bh) =>
      formatSalonTime(startDate) >= bh.startTime &&
      formatSalonTime(startDate) < bh.endTime,
  );

  const isBusinessBlocked = businessBlockHour.some(
    (bh) =>
      formatSalonTime(startDate) >= bh.startTime &&
      formatSalonTime(startDate) < bh.endTime,
  );

  if (isBlocked || isBusinessBlocked) {
    throw new Error(
      'The selected time slot is blocked. Please choose a different time.',
    );
  }

  const result = await Booking.create({
    ...payload,
    shopCategoryId: shop.shopCategoryId,
    startTime: startDate,
    endTime: endDate,
    customerId,
    services: servicesWithPrices,
    status: ENUM_BOOKING_STATUS.PENDING,
    totalPrice,
    totalDuration,
  });

  console.log('Booking created with ID:', result);

  const amount = totalPrice;
  const amountInCents = toStripeAmount(totalPrice);
  const adminFee = Math.round(totalPrice * 0.05);
  if (adminFee >= amount) {
    throw new Error(
      'Admin fee cannot be greater than or equal to the total amount.',
    );
  }

  if (
    !config.stripe.stripe_secret_key ||
    !config.stripe.booking_payment_success_url ||
    !config.stripe.payment_cancel_url
  ) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Stripe payment configuration is incomplete. Please verify the Stripe secret key and redirect URLs.',
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Salon Appointment',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: result._id.toString(),
        paymentPurpose: ENUM_PAYMENT_PURPOSE.BOOKING,
      },
      success_url: `${config.stripe.booking_payment_success_url}`,
      cancel_url: `${config.stripe.payment_cancel_url}`,
    });

    console.log('Stripe checkout session created:', session);

    return { url: session.url };
  } catch (error: any) {
    console.error('Stripe checkout session creation failed:', error);
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      error?.message || 'Failed to initialize online payment checkout',
    );
  }
};

const createBooking = async (customerId: string, payload: any) => {
  let result;
  const { paymentType } = payload;

  if (paymentType === ENUM_PAYMENT_TYPE.PAY_ON_SHOP) {
    result = await createPayOnShopBooking(customerId, payload);
  } else if (paymentType === ENUM_PAYMENT_TYPE.ONLINE) {
    result = await createOnlineBooking(customerId, payload);
  } else {
    throw new AppError(httpStatus.BAD_REQUEST, 'Unsupported payment type');
  }
  console.log('result', result);
  return result;
};

const getCustomerBookings = async (
  customerId: string,
  query: Record<string, unknown>,
) => {
  const bookingQuery = new QueryBuilder(
    Booking.find({
      customerId: customerId,
      status: { $ne: ENUM_BOOKING_STATUS.CANCELED },
    }).populate({
      path: 'shopId',
      select: 'shopName shopImages location address',
    }),
    query,
  )
    .search(['customerId'])
    .filter()
    .sort()
    .paginate()
    .fields();
  const meta = await bookingQuery.countTotal();
  const result = await bookingQuery.modelQuery;

  return {
    meta,
    result,
  };
};

// get single booking
const getSingleBooking = async (id: string) => {
  const result = await Booking.findById(id)
    .populate({
      path: 'shopId',
      select: 'shopImages shopName location',
    })
    .populate({
      path: 'services.serviceId',
      select: 'serviceName price durationMinutes',
    })
    .populate({
      path: 'customerId',
      select: 'firstName lastName profile_image',
    })
    .populate({ path: 'staffId', select: 'name appointmentColor' });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  return result;
};

// cancel reschedule request
const createCancelBookingRequest = async (
  userData: JwtPayload,
  bookingId: string,
) => {
  let booking;
  if (userData.role === USER_ROLE.client) {
    booking = await Booking.findOne({
      _id: bookingId,
      shopId: userData?.profileId,
      status: ENUM_BOOKING_STATUS.BOOKED,
    });
  } else if (userData?.role === USER_ROLE.customer) {
    booking = await Booking.findOne({
      _id: bookingId,
      customerId: userData?.profileId,
      status: ENUM_BOOKING_STATUS.BOOKED,
    });
  }
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  // Get the current time and booking start time
  const currentTime = new Date();
  const startTime = new Date(booking.startTime);

  // Calculate the difference in hours
  const timeDifferenceInMs = startTime.getTime() - currentTime.getTime();
  const timeDifferenceInHours = timeDifferenceInMs / (1000 * 60 * 60);

  if (timeDifferenceInHours < 2) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You can only send a cancellation request at least 2 hours before the booking start time.',
    );
  }
  const shop = await Client.findById(booking.shopId).select(
    'shopName shopImages user',
  );
  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  const customer = await Customer.findById(booking.customerId).select(
    'firstName lastName profile_image',
  );

  const requestReceiver =
    userData.role === USER_ROLE.client ? booking.customerId : booking.shopId;

  const notificationMessage =
    userData.role === USER_ROLE.client
      ? `${shop.shopName} requesting to cancel the booking`
      : `${
          customer?.firstName + ' ' + customer?.lastName
        } requesting to cancel the booking`;
  const notificationImage = USER_ROLE.client
    ? `${shop?.shopImages[0]}`
    : `${customer?.profile_image}`;

  const notificationData = {
    title: 'Cancel Request',
    message: notificationMessage,
    image: notificationImage,
    receiver: requestReceiver,
    type: ENUM_NOTIFICATION_TYPE.CANCEL_BOOKING,
    bookingId: booking._id,
  };

  appEventEmitter.emit('booking.cancel.requested', {
    ...notificationData,
    receiver: requestReceiver.toString(),
    bookingId: booking._id.toString(),
  });
};

const changeCancelBookingRequestStatus = async (
  userData: JwtPayload,
  notificationId: string,
  status: string,
) => {
  let result;
  if (status === 'accept') {
    result = await acceptCancelBookingRequest(userData, notificationId);
  } else {
    result = await rejectCancelBookingRequest(userData, notificationId);
  }

  return result;
};

const acceptCancelBookingRequest = async (
  userData: JwtPayload,
  notificationId: string,
) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  const booking = await Booking.findById(notification.bookingId);
  console.log('booking', booking);
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  const shop = await Client.findById(booking.shopId).select(
    'shopName shopImages stripAccountId _id user',
  );

  const customer = await Customer.findById(booking.customerId).select(
    'firstName lastName profile_image _id user',
  );

  const requestReceiver =
    userData.role === USER_ROLE.client ? booking.customerId : booking.shopId;

  // refund -----------------------------------
  if (userData?.role === USER_ROLE.customer) {
    if (booking?.paymentType === ENUM_PAYMENT_TYPE.ONLINE) {
      const refundAmountInCents = toStripeAmount(booking.totalPrice);
      try {
        await stripe.refunds.create(
          {
            payment_intent: booking.paymentIntentId,
            amount: refundAmountInCents,
          },
          {
            idempotencyKey: `booking-${booking._id}-customer-full-refund`,
          },
        );
      } catch (error: unknown) {
        console.error('Refund failed:', error);
        throw new AppError(
          httpStatus.SERVICE_UNAVAILABLE,
          'Stripe refund failed. Please try again or contact support.',
        );
      }
    }
  } else if (userData?.role === USER_ROLE.client) {
    const currentTime = notification?.createdAt || new Date();
    const startTime = new Date(booking.startTime);
    const timeDifferenceInMs = startTime.getTime() - currentTime.getTime();
    const timeDifferenceInHours = timeDifferenceInMs / (1000 * 60 * 60);
    let refundPercentage = 50;
    if (timeDifferenceInHours >= 24) {
      refundPercentage = 100;
    }
    if (booking?.paymentType === ENUM_PAYMENT_TYPE.ONLINE) {
      const refundAmountInCents = toStripeAmount(
        (booking.totalPrice * refundPercentage) / 100,
      );

      try {
        await stripe.refunds.create(
          {
            payment_intent: booking.paymentIntentId,
            amount: refundAmountInCents,
          },
          {
            idempotencyKey: `booking-${booking._id}-client-${refundPercentage}-refund`,
          },
        );
        if (refundPercentage == 50) {
          const transferAmountInCent = toStripeAmount(
            (booking.totalPrice * refundPercentage) / 100,
          );
          try {
            // Transfer funds
            console.log('start tranfer');
            const transfer: any = await stripe.transfers.create(
              {
                amount: transferAmountInCent,
                currency: 'eur',
                destination: shop?.stripAccountId as string,
              },
              {
                idempotencyKey: `booking-${booking._id}-client-cancel-transfer`,
              },
            );
            console.log('transfer', transfer);

            // Payout to bank
            try {
              console.log('start payouts');
              const payout = await stripe.payouts.create(
                {
                  amount: transferAmountInCent,
                  currency: 'eur',
                },
                {
                  stripeAccount: shop?.stripAccountId as string,
                  idempotencyKey: `booking-${booking._id}-client-cancel-payout`,
                },
              );
              console.log('payout', payout);
            } catch (payoutError) {
              console.error(
                'Stripe payout skipped or failed (likely due to pending funds):',
                payoutError,
              );
            }
          } catch (error) {
            console.error('Error during transfer:', error);
            throw error;
          }
        }
      } catch (error: unknown) {
        console.error('Stripe refund/transfer failed:', error);
        throw new AppError(
          httpStatus.SERVICE_UNAVAILABLE,
          'Stripe refund or transfer failed. Please try again or contact support.',
        );
      }
    }
  }

  // Update booking status to canceled and delete notification
  await Booking.findByIdAndUpdate(booking._id, {
    status: ENUM_BOOKING_STATUS.CANCELED,
  });
  await Notification.findByIdAndDelete(notificationId);

  const notificationMessage =
    userData.role === USER_ROLE.client
      ? `${shop?.shopName || 'Salon'} accept your cancel request`
      : `${
          customer?.firstName + ' ' + customer?.lastName
        } accept your cancel request`;
  const notificationImage =
    userData.role === USER_ROLE.client
      ? `${shop?.shopImages?.[0] || ''}`
      : `${customer?.profile_image || ''}`;
  const notificationData = {
    title: 'Cancel Request Accepted',
    message: notificationMessage,
    image: notificationImage,
    receiver: requestReceiver,
    bookingId: booking._id,
    type: ENUM_NOTIFICATION_TYPE.GENERAL,
  };
  appEventEmitter.emit('booking.cancel.accepted', {
    ...notificationData,
    receiver: requestReceiver.toString(),
    bookingId: booking._id.toString(),
  });
};

const rejectCancelBookingRequest = async (
  userData: JwtPayload,
  notificationId: string,
) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  const booking = await Booking.findById(notification.bookingId);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  const shop = await Client.findById(booking.shopId).select(
    'shopName shopImages user',
  );

  const customer = await Customer.findById(booking.customerId).select(
    'firstName lastName profile_image user',
  );

  await Notification.findByIdAndDelete(notificationId);
  const requestReceiver =
    userData.role === USER_ROLE.client ? booking.customerId : booking.shopId;
  const notificationMessage =
    userData.role === USER_ROLE.client
      ? `${shop.shopName} reject your cancel request`
      : `${
          customer?.firstName + ' ' + customer?.lastName
        } reject your cancel request`;
  const notificationImage = USER_ROLE.client
    ? `${shop?.shopImages[0]}`
    : `${customer?.profile_image}`;
  const notificationData = {
    title: 'Cancel Request Rejected',
    message: notificationMessage,
    image: notificationImage,
    receiver: requestReceiver,
    bookingId: booking._id,
    type: ENUM_NOTIFICATION_TYPE.GENERAL,
  };

  appEventEmitter.emit('booking.cancel.rejected', {
    ...notificationData,
    receiver: requestReceiver.toString(),
    bookingId: booking._id.toString(),
  });
};

const getShopBookings = async (
  shopId: string,
  query: Record<string, unknown>,
) => {
  if (query.startTime) {
    // Match the whole salon-local (Germany) calendar day of the given value.
    // "YYYY-MM-DD" is read as a salon date; a full ISO instant is mapped to
    // the salon day it falls on.
    const rawStart = String(query.startTime);
    const dayAnchor = DATE_ONLY_REGEX.test(rawStart)
      ? toSalonDateTime(rawStart, '12:00')
      : new Date(rawStart);
    query.startTime = {
      $gte: startOfSalon('day', dayAnchor),
      $lte: endOfSalon('day', dayAnchor),
    };
  }
  if (!query.sort) {
    query.sort = 'startTime';
  }

  // Check for service filter in query
  // if (query.serviceId) {
  //   query['services.serviceId'] = query.serviceId;
  //   delete query.serviceId;
  // }
  // if (query.staffId) {
  //   query['staffId'] = query.staffId;
  // }
  const bookingQuery = new QueryBuilder(
    Booking.find({
      shopId,
      status: {
        $in: [ENUM_BOOKING_STATUS.BOOKED, ENUM_BOOKING_STATUS.COMPLETED],
      },
    })
      .populate({
        path: 'staffId',
        select: 'name appointmentColor',
      })
      .populate({ path: 'shopId', select: 'shopName' }).populate({path: 'customerId', select: 'firstName lastName profile_image'}),
    query,
  )
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  // Populate `services.serviceId` with the full service details
  bookingQuery.modelQuery = bookingQuery.modelQuery.populate({
    path: 'services.serviceId',
    model: 'Service',
    select: 'serviceName durationMinutes price',
  });
  const meta = await bookingQuery.countTotal();
  const result = await bookingQuery.modelQuery;

  return {
    meta,
    result,
  };
};

// get pay on shop booking history
const getPayOnShopBookingHistory = async (
  shopId: string,
  query: Record<string, unknown>,
) => {
  const payOnShopBookingQuery = new QueryBuilder(
    Booking.find({
      shopId: shopId,
      paymentType: ENUM_PAYMENT_TYPE.PAY_ON_SHOP,
      status: { $ne: ENUM_BOOKING_STATUS.CANCELED },
    }).select('startTime endTime totalPrice services'),
    query,
  )
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  payOnShopBookingQuery.modelQuery = payOnShopBookingQuery.modelQuery.populate({
    path: 'services.serviceId',
    model: 'Service',
    select: 'serviceName price',
  });
  const meta = await payOnShopBookingQuery.countTotal();
  const result = await payOnShopBookingQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSalesAndServiceData = async (
  shopId: string,
  query: Record<string, unknown>,
) => {
  //!TODO: need to make changes
  const matchQuery: any = {
    shopId: new mongoose.Types.ObjectId(shopId),
    ...REVENUE_BOOKING_MATCH,
  };

  if (query.staffId) {
    matchQuery.staffId = new mongoose.Types.ObjectId(query.staffId as string);
  }

  const currentDate = new Date();
  let dateFilter: any = {};

  if (query.timeRange === 'today') {
    // Start and end of today in salon (Germany) time
    dateFilter = {
      startTime: {
        $gte: startOfSalon('day', currentDate),
        $lte: endOfSalon('day', currentDate),
      },
    };
  } else if (query.timeRange === 'last-month') {
    // Whole current month in salon time (inclusive of the last day)
    dateFilter = {
      startTime: {
        $gte: startOfSalon('month', currentDate),
        $lte: endOfSalon('month', currentDate),
      },
    };
  } else if (query.timeRange === 'last-year') {
    // Get the first and last date of the current year (this year, not the last year)
    const salonYear = Number(formatSalonDate(currentDate).slice(0, 4));
    dateFilter = {
      startTime: {
        $gte: startOfSalonYear(salonYear),
        $lte: endOfSalonYear(salonYear),
      },
    };
  }

  if (Object.keys(dateFilter).length > 0) {
    matchQuery.startTime = dateFilter.startTime;
  }

  // const result = await Booking.aggregate([
  //   {
  //     $match: matchQuery,
  //   },
  //   {
  //     $facet: {
  //       totalSales: [
  //         {
  //           $group: {
  //             _id: null,
  //             totalSales: { $sum: '$totalPrice' },
  //           },
  //         },
  //       ],
  //       serviceDetails: [
  //         {
  //           $unwind: '$services',
  //         },
  //         {
  //           $group: {
  //             _id: '$services.serviceId',
  //             serviceCount: { $sum: 1 },
  //             totalSales: { $sum: '$services.price' },
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: 'services',
  //             localField: '_id',
  //             foreignField: '_id',
  //             as: 'serviceDetails',
  //           },
  //         },
  //         {
  //           $unwind: '$serviceDetails',
  //         },
  //         {
  //           $project: {
  //             serviceName: '$serviceDetails.name',
  //             serviceCount: 1,
  //             totalSales: 1,
  //           },
  //         },
  //       ],
  //     },
  //   },
  //   {
  //     $unwind: '$totalSales',
  //   },
  // ]);

  const result = await Booking.aggregate([
    {
      $match: matchQuery,
    },
    {
      $facet: {
        totalSales: [
          {
            $group: {
              _id: null,
              totalSales: { $sum: '$totalPrice' },
            },
          },
        ],
        serviceDetails: [
          {
            $unwind: '$services',
          },
          {
            $group: {
              _id: '$services.serviceId', // Group by serviceId
              serviceCount: { $sum: 1 },
              totalSales: { $sum: '$services.price' },
            },
          },
          {
            $lookup: {
              from: 'services',
              localField: '_id', // serviceId in Booking
              foreignField: '_id', // _id in services
              as: 'serviceDetails',
            },
          },
          {
            $unwind: '$serviceDetails', // Convert array to object
          },
          {
            $project: {
              serviceName: '$serviceDetails.serviceName',
              serviceCount: 1,
              totalSales: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$totalSales',
    },
  ]);
  const totalSales = result[0]?.totalSales?.totalSales || 0;
  const serviceDetails = result[0]?.serviceDetails || [];

  return {
    totalSales,
    serviceDetails,
  };
};

const markNoShow = async (shopId: string, id: string) => {
  let result;
  const currentTime = new Date();
  const booking = await Booking.findOne({
    _id: id,
    shopId: shopId,
    endTime: { $lt: currentTime },
  });
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  // const result = await Booking.findByIdAndUpdate(
  //   id,
  //   { status: 'completed' },
  //   { new: true, runValidators: true },
  // );

  // return result;
  if (booking.paymentType === ENUM_PAYMENT_TYPE.ONLINE) {
    result = await completeStripeBooking(id);
    // the customer already paid online, so a no-show still counts as revenue;
    // the flag is kept for reporting
    result = await Booking.findByIdAndUpdate(
      id,
      { isNoShow: true },
      { new: true },
    );
  } else if (booking.paymentType === ENUM_PAYMENT_TYPE.PAY_ON_SHOP) {
    result = await completePayOnShopBooking(id, true);
  } else {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Unsupported booking payment method',
    );
  }
  return result;
};

// const getSingleBooking = async (id: string) => {
//   const booking = await Booking.findById(id).populate('services.serviceId');
//   if (!booking) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
//   }
//   return booking;
// };

const markAsComplete = async (bookingId: string) => {
  let result;
  const booking = await Booking.findOne({
    _id: bookingId,
    status: ENUM_BOOKING_STATUS.BOOKED,
  });
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  if (booking.paymentType === ENUM_PAYMENT_TYPE.ONLINE) {
    result = await completeStripeBooking(bookingId);
  } else if (booking.paymentType === ENUM_PAYMENT_TYPE.PAY_ON_SHOP) {
    result = await completePayOnShopBooking(bookingId);
  } else {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Unsupported booking payment method',
    );
  }
  return result;
};

const completePayOnShopBooking = async (
  bookingId: string,
  isNoShow = false,
) => {
  const booking = await Booking.findOne({
    _id: bookingId,
    status: ENUM_BOOKING_STATUS.BOOKED,
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  const result = await Booking.findByIdAndUpdate(
    bookingId,
    {
      status: ENUM_BOOKING_STATUS.COMPLETED,
      isNoShow,
    },
    { new: true, runValidators: true },
  );

  // Pay-on-shop money only actually changes hands when the appointment is
  // completed, so the transaction log entry is created here rather than at
  // booking creation time. No-show bookings never collect payment, so they
  // skip this (isNoShow = true).
  if (!isNoShow) {
    await Transaction.findOneAndUpdate(
      { transactionId: `payonshop-${bookingId}` },
      {
        senderEntityId: booking.customerId,
        senderEntityType: 'Customer',
        receiverEntityId: booking.shopId,
        receiverEntityType: 'Client',
        amount: booking.totalPrice,
        type: 'Booking',
        paymentMethod: ENUM_PAYMENT_METHOD.PAY_ON_SHOP,
        transactionId: `payonshop-${bookingId}`,
        status: 'success',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  return result;
};

const completeStripeBooking = async (bookingId: string) => {
  const booking = await Booking.findOne({
    _id: bookingId,
    status: ENUM_BOOKING_STATUS.BOOKED,
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  // Compare current datetime with startTime
  const currentDateTime = new Date();
  if (currentDateTime < booking.startTime) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot complete booking before start time',
    );
  }
  const shop = await Client.findById(booking?.shopId);
  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }
  const bookingAmount = booking.totalPrice;
  const adminFee = bookingAmount * 0.05;
  const amountInCent = toStripeAmount(bookingAmount - adminFee);
  const readiness = await getStripeAccountReadiness(shop.stripAccountId);
  if (!readiness.ready) {
    throw new AppError(httpStatus.BAD_REQUEST, readiness.message);
  }
  try {
    // Transfer funds
    const transfer: any = await stripe.transfers.create(
      {
        amount: amountInCent,
        currency: 'eur',
        destination: shop.stripAccountId as string,
      },
      {
        idempotencyKey: `booking-${bookingId}-completion-transfer`,
      },
    );
    console.log('transfer', transfer);

    // Payout to bank
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const payout = await stripe.payouts.create(
        {
          amount: amountInCent,
          currency: 'eur',
        },
        {
          stripeAccount: shop.stripAccountId as string,
          idempotencyKey: `booking-${bookingId}-completion-payout`,
        },
      );
    } catch (payoutError) {
      console.error(
        'Stripe payout skipped or failed (likely due to pending funds):',
        payoutError,
      );
    }

    // Update booking data
    const result = await Booking.findByIdAndUpdate(
      bookingId,
      { status: ENUM_BOOKING_STATUS.COMPLETED },
      { new: true, runValidators: true },
    );
    return result;
  } catch (error) {
    console.error('Error during transfer:', error);
    throw error;
  }
};

// crone job-----------------------------------
cron.schedule('*/10 * * * *', async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = await Booking.deleteMany({
      status: ENUM_BOOKING_STATUS.PENDING,
      createdAt: { $lte: fiveMinutesAgo },
    });
    console.log(`Deleted ${result.deletedCount} pending bookings`);
  } catch (error) {
    console.error('Error running cron job:', error);
  }
});

// Auto-complete bookings whose appointment time has passed -----------------
// Gives staff a 3 hour grace window to mark a no-show before a booking is
// assumed completed, so past appointments move out of "Upcoming" and the
// customer can leave a review.
const AUTO_COMPLETE_GRACE_PERIOD_MS = 3 * 60 * 60 * 1000;
let isAutoCompletingBookings = false;

cron.schedule('*/15 * * * *', async () => {
  if (isAutoCompletingBookings) {
    console.log('Skipping auto-complete run: previous run still in progress');
    return;
  }
  isAutoCompletingBookings = true;
  try {
    const graceCutoff = new Date(Date.now() - AUTO_COMPLETE_GRACE_PERIOD_MS);
    const overdueBookings = await Booking.find({
      status: ENUM_BOOKING_STATUS.BOOKED,
      endTime: { $lte: graceCutoff },
    });

    for (const booking of overdueBookings) {
      const bookingId = booking._id.toString();
      try {
        if (booking.paymentType === ENUM_PAYMENT_TYPE.ONLINE) {
          await completeStripeBooking(bookingId);
        } else if (booking.paymentType === ENUM_PAYMENT_TYPE.PAY_ON_SHOP) {
          await completePayOnShopBooking(bookingId);
        }
      } catch (error) {
        // Leave status as BOOKED on failure so the next tick retries it.
        console.error(`Auto-complete failed for booking ${bookingId}:`, error);
      }
    }

    if (overdueBookings.length > 0) {
      console.log(`Auto-completed ${overdueBookings.length} overdue bookings`);
    }
  } catch (error) {
    console.error('Error running auto-complete booking cron job:', error);
  } finally {
    isAutoCompletingBookings = false;
  }
});

const BookingService = {
  createBooking,
  getCustomerBookings,
  createCancelBookingRequest,
  changeCancelBookingRequestStatus,
  getShopBookings,
  getPayOnShopBookingHistory,
  getSalesAndServiceData,
  markNoShow,
  getSingleBooking,
  markAsComplete,
};

export default BookingService;
