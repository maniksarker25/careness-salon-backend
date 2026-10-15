/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import httpStatus from 'http-status';
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

const handleBookingPaymentSuccess = async (
  bookingId: string,
  transactionId: string,
  amount: number,
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  const existingTransaction = await Transaction.findOne({ transactionId });
  if (existingTransaction) {
    return;
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    {
      status: ENUM_BOOKING_STATUS.BOOKED,
      paymentIntentId: transactionId,
    },
    { new: true, runValidators: true },
  );

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

  if (updatedBooking) {
    await emitNewBookingNotification(updatedBooking);
  }
};

export default handlePaymentSuccess;
