/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import httpStatus from 'http-status';
import Stripe from 'stripe';
import config from '../config';
import AppError from '../error/appError';
import {
  ENUM_BOOKING_STATUS,
  ENUM_PAYMENT_METHOD,
  ENUM_PAYMENT_PURPOSE,
} from '../utilities/enum';
import Client from '../modules/client/client.model';
import Transaction from '../modules/transaction/transaction.model';
import Booking from '../modules/booking/booking.model';
import emitNewBookingNotification from '../helper/emitNewBookingNotification';

const stripe = new Stripe(config.stripe.stripe_secret_key as string);

const handlePaymentSuccess = async (
  metaData: any,
  transactionId: string,
  amount: number,
) => {
  if (!metaData?.paymentPurpose || !transactionId || !amount) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid Stripe payment data');
  }

  if (metaData.paymentPurpose == ENUM_PAYMENT_PURPOSE.ADMIN_FEE) {
    await handleAdminFeePaymentSuccess(metaData.shopId, transactionId, amount);
  } else if (metaData.paymentPurpose == ENUM_PAYMENT_PURPOSE.BOOKING) {
    await handleBookingPaymentSuccess(
      metaData.bookingId,
      transactionId,
      amount,
    );
  } else {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid payment purpose');
  }
};

const handleAdminFeePaymentSuccess = async (
  shopId: string,
  transactionId: string,
  amount: number,
) => {
  const shop = await Client.findById(shopId);
  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  const existingTransaction = await Transaction.findOne({ transactionId });
  if (existingTransaction) {
    return;
  }

  await Client.findByIdAndUpdate(
    shopId,
    {
      $inc: { payOnShopChargeDueAmount: -amount },
    },
    { new: true, runValidators: true },
  );
  await Transaction.create({
    senderEntityId: shopId,
    senderEntityType: 'Client',
    amount: amount,
    type: 'Shop Charge',
    paymentMethod: ENUM_PAYMENT_METHOD.STRIPE,
    transactionId,
  });
};

const refundUnclaimedBookingPayment = async (
  paymentIntentId: string,
  bookingId: string,
) => {
  try {
    await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        metadata: {
          bookingId,
          reason: 'booking-hold-expired',
        },
      },
      { idempotencyKey: `booking-hold-refund-${paymentIntentId}` },
    );
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? error.code
        : undefined;
    if (code === 'charge_already_refunded') {
      return;
    }
    throw error;
  }
};

const recordBookingTransaction = async (
  booking: { customerId: unknown; shopId: unknown },
  transactionId: string,
  amount: number,
) => {
  const existingTransaction = await Transaction.findOne({ transactionId });
  if (existingTransaction) {
    return;
  }
  await Transaction.create({
    senderEntityId: booking.customerId,
    senderEntityType: 'Customer',
    receiverEntityId: booking.shopId,
    receiverEntityType: 'Client',
    amount: amount,
    type: 'Booking',
    paymentMethod: ENUM_PAYMENT_METHOD.STRIPE,
    transactionId,
  });
};

const handleBookingPaymentSuccess = async (
  bookingId: string,
  transactionId: string,
  amount: number,
) => {
  const booking = await Booking.findById(bookingId);
  if (
    booking?.status === ENUM_BOOKING_STATUS.BOOKED &&
    booking.paymentIntentId === transactionId
  ) {
    await recordBookingTransaction(booking, transactionId, amount);
    return;
  }

  if (!booking || booking.status !== ENUM_BOOKING_STATUS.PENDING) {
    await refundUnclaimedBookingPayment(transactionId, bookingId);
    return;
  }

  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: ENUM_BOOKING_STATUS.PENDING },
    {
      $set: {
        status: ENUM_BOOKING_STATUS.BOOKED,
        paymentIntentId: transactionId,
      },
    },
    { new: true, runValidators: true },
  );
  if (!updatedBooking) {
    await refundUnclaimedBookingPayment(transactionId, bookingId);
    return;
  }

  await recordBookingTransaction(updatedBooking, transactionId, amount);
  await emitNewBookingNotification(updatedBooking);
};

export default handlePaymentSuccess;
