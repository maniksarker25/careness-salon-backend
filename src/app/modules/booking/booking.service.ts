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
import { ENUM_NOTIFICATION_TYPE as NOTIFICATION_EVENT_TYPE } from '../notification/notification.enum';
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
import {
  claimBookingFinancialOperation,
  processBookingFinancialOperation,
} from './bookingFinancialOperation.service';
import { BOOKING_FINANCIAL_OPERATION_TYPE } from './bookingFinancialOperation.model';
const stripe = new Stripe(config.stripe.stripe_secret_key as string);

const toStripeAmount = (amount: number) => Math.round(amount * 100);
const CHECKOUT_HOLD_MS = 5 * 60 * 1000;
const CHECKOUT_SESSION_MAX_AGE_SECONDS = 30 * 60 + 60;
const PLATFORM_FEE_PERCENT = 5;

const getSucceededChargeInCents = async (paymentIntentId: string) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const chargedCents = paymentIntent.amount_received;
  if (
    paymentIntent.status !== 'succeeded' ||
    paymentIntent.currency !== 'eur' ||
    !Number.isInteger(chargedCents) ||
    chargedCents < 1
  ) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Booking payment is not a succeeded EUR charge',
    );
  }
  return chargedCents;
};

const splitHalfCharge = (chargedCents: number) => {
  const transferAmountInCents = Math.floor(chargedCents / 2);
  return {
    refundAmountInCents: chargedCents - transferAmountInCents,
    transferAmountInCents,
  };
};

const salonTransferAfterPlatformFee = (chargedCents: number) => {
  const adminFeeCents = Math.round((chargedCents * PLATFORM_FEE_PERCENT) / 100);
  return {
    adminFeeCents,
    transferAmountInCents: chargedCents - adminFeeCents,
  };
};

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

  const amountInCents = toStripeAmount(totalPrice);
  const { transferAmountInCents } = salonTransferAfterPlatformFee(amountInCents);
  if (transferAmountInCents < 1) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Booking amount is too small to transfer to the salon.',
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

  let checkoutSessionId: string | undefined;
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
      payment_intent_data: {
        metadata: {
          bookingId: result._id.toString(),
          paymentPurpose: ENUM_PAYMENT_PURPOSE.BOOKING,
        },
      },
      expires_at:
        Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_MAX_AGE_SECONDS,
      success_url: `${config.stripe.booking_payment_success_url}`,
      cancel_url: `${config.stripe.payment_cancel_url}`,
    });
    checkoutSessionId = session.id;

    const savedSession = await Booking.updateOne(
      { _id: result._id, status: ENUM_BOOKING_STATUS.PENDING },
      { $set: { checkoutSessionId: session.id } },
    );
    if (savedSession.modifiedCount === 0) {
      await stripe.checkout.sessions.expire(session.id).catch((expireError) => {
        console.error('Failed to expire checkout after the hold ended:', expireError);
      });
      throw new AppError(
        httpStatus.CONFLICT,
        'The booking hold ended before checkout could start',
      );
    }

    return { url: session.url };
  } catch (error: any) {
    const removedHold = await Booking.deleteOne({
      _id: result._id,
      status: ENUM_BOOKING_STATUS.PENDING,
    });
    if (checkoutSessionId && removedHold.deletedCount > 0) {
      await stripe.checkout.sessions
        .expire(checkoutSessionId)
        .catch((expireError) => {
          console.error(
            'Failed to expire checkout after booking creation failed:',
            expireError,
          );
        });
    }
    if (error instanceof AppError) {
      throw error;
    }
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

const assertUserCanRespondToCancelRequest = (
  userData: JwtPayload,
  notification: { type?: string; receiver?: unknown },
  booking: {
    customerId?: { toString(): string };
    shopId?: { toString(): string };
  },
) => {
  const profileId = userData.profileId?.toString();
  const isCancelRequest =
    notification.type === NOTIFICATION_EVENT_TYPE.BOOKING_CANCEL_REQUESTED ||
    notification.type === ENUM_NOTIFICATION_TYPE.CANCEL_BOOKING;
  const isReceiver =
    Boolean(profileId) && notification.receiver?.toString() === profileId;
  const isBookingParty =
    (userData.role === USER_ROLE.customer &&
      booking.customerId?.toString() === profileId) ||
    (userData.role === USER_ROLE.client &&
      booking.shopId?.toString() === profileId);

  if (!isCancelRequest || !isReceiver || !isBookingParty) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not allowed to respond to this cancellation request',
    );
  }
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
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  assertUserCanRespondToCancelRequest(userData, notification, booking);
  const shop = await Client.findById(booking.shopId).select(
    'shopName shopImages stripAccountId _id user',
  );

  const customer = await Customer.findById(booking.customerId).select(
    'firstName lastName profile_image _id user',
  );

  const requestReceiver =
    userData.role === USER_ROLE.client ? booking.customerId : booking.shopId;

  let refundAmountInCents = 0;
  let transferAmountInCents = 0;
  if (booking.paymentType === ENUM_PAYMENT_TYPE.ONLINE) {
    if (!booking.paymentIntentId) {
      throw new AppError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Salon Stripe account or booking payment is unavailable for cancellation.',
      );
    }
    const chargedCents = await getSucceededChargeInCents(
      booking.paymentIntentId,
    );
    if (userData.role === USER_ROLE.customer) {
      refundAmountInCents = chargedCents;
    } else if (userData.role === USER_ROLE.client) {
      const currentTime = notification?.createdAt || new Date();
      const startTime = new Date(booking.startTime);
      const timeDifferenceInMs = startTime.getTime() - currentTime.getTime();
      const timeDifferenceInHours = timeDifferenceInMs / (1000 * 60 * 60);
      if (timeDifferenceInHours >= 24) {
        refundAmountInCents = chargedCents;
      } else {
        const halfCharge = splitHalfCharge(chargedCents);
        refundAmountInCents = halfCharge.refundAmountInCents;
        transferAmountInCents = halfCharge.transferAmountInCents;
      }
    }
  }

  if (
    (refundAmountInCents > 0 || transferAmountInCents > 0) &&
    (!booking.paymentIntentId ||
      (transferAmountInCents > 0 && !shop?.stripAccountId))
  ) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Salon Stripe account or booking payment is unavailable for cancellation.',
    );
  }

  const financialOperation = await claimBookingFinancialOperation({
    bookingId: booking._id,
    type: BOOKING_FINANCIAL_OPERATION_TYPE.CANCELLATION,
    sourcePaymentIntentId: booking.paymentIntentId,
    destinationAccountId: shop?.stripAccountId,
    refundAmountInCents,
    transferAmountInCents,
    currency: 'eur',
  });
  await processBookingFinancialOperation(financialOperation._id.toString());

  const canceledBooking = await Booking.findById(booking._id);
  if (!canceledBooking || canceledBooking.status !== ENUM_BOOKING_STATUS.CANCELED) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Booking status changed while accepting the cancellation request.',
    );
  }
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
  assertUserCanRespondToCancelRequest(userData, notification, booking);
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

const markAsComplete = async (userData: JwtPayload, bookingId: string) => {
  let result;
  const profileId = userData.profileId?.toString();
  const ownerFilter =
    profileId && userData.role === USER_ROLE.client
      ? { shopId: profileId }
      : profileId && userData.role === USER_ROLE.customer
        ? { customerId: profileId }
        : null;
  if (!ownerFilter) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not allowed to complete this booking',
    );
  }
  const booking = await Booking.findOne({
    _id: bookingId,
    status: ENUM_BOOKING_STATUS.BOOKED,
    ...ownerFilter,
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
  const result = await Booking.findOneAndUpdate(
    { _id: bookingId, status: ENUM_BOOKING_STATUS.BOOKED },
    { $set: { status: ENUM_BOOKING_STATUS.COMPLETED, isNoShow } },
    { new: true, runValidators: true },
  );
  if (!result) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Booking status changed before completion.',
    );
  }

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
  if (!shop.stripAccountId || !booking.paymentIntentId) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Salon Stripe account or booking payment is unavailable for transfer.',
    );
  }
  const chargedCents = await getSucceededChargeInCents(booking.paymentIntentId);
  const { transferAmountInCents } = salonTransferAfterPlatformFee(chargedCents);
  if (transferAmountInCents < 1) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Booking amount is too small to transfer to the salon.',
    );
  }

  const financialOperation = await claimBookingFinancialOperation({
    bookingId: booking._id,
    type: BOOKING_FINANCIAL_OPERATION_TYPE.COMPLETION,
    sourcePaymentIntentId: booking.paymentIntentId,
    destinationAccountId: shop.stripAccountId,
    refundAmountInCents: 0,
    transferAmountInCents,
    currency: 'eur',
  });
  await processBookingFinancialOperation(financialOperation._id.toString());
  const completedBooking = await Booking.findOne({
    _id: bookingId,
    status: ENUM_BOOKING_STATUS.COMPLETED,
  });
  if (!completedBooking) {
    throw new AppError(httpStatus.CONFLICT, 'Booking status has changed');
  }

  return completedBooking;
};

const releaseUnpaidPendingBooking = async (booking: {
  _id: { toString(): string };
  checkoutSessionId?: string;
}) => {
  if (booking.checkoutSessionId) {
    let session = await stripe.checkout.sessions.retrieve(
      booking.checkoutSessionId,
    );
    if (session.payment_status === 'paid') {
      return;
    }
    if (session.status === 'open') {
      try {
        session = await stripe.checkout.sessions.expire(
          booking.checkoutSessionId,
        );
      } catch (error) {
        session = await stripe.checkout.sessions.retrieve(
          booking.checkoutSessionId,
        );
        if (session.payment_status === 'paid') {
          return;
        }
        if (session.status === 'open') {
          throw error;
        }
      }
    }
    if (session.payment_status === 'paid') {
      return;
    }
  }

  await Booking.deleteOne({
    _id: booking._id,
    status: ENUM_BOOKING_STATUS.PENDING,
  });
};

// Unpaid online holds block the staff slot for 5 minutes. Close Checkout
// before deleting the booking so a later payment cannot capture money.
let isReleasingUnpaidBookings = false;
cron.schedule('* * * * *', async () => {
  if (isReleasingUnpaidBookings) {
    return;
  }
  isReleasingUnpaidBookings = true;
  try {
    const holdCutoff = new Date(Date.now() - CHECKOUT_HOLD_MS);
    const staleBookings = await Booking.find({
      status: ENUM_BOOKING_STATUS.PENDING,
      createdAt: { $lte: holdCutoff },
    })
      .select('_id checkoutSessionId')
      .limit(50);

    for (const booking of staleBookings) {
      try {
        await releaseUnpaidPendingBooking(booking);
      } catch (error) {
        console.error(
          `Failed to release unpaid booking ${booking._id}:`,
          error,
        );
      }
    }
  } catch (error) {
    console.error('Error releasing unpaid bookings:', error);
  } finally {
    isReleasingUnpaidBookings = false;
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
