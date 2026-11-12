import cron from 'node-cron';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import config from '../../config';
import AppError from '../../error/appError';
import { getStripeAccountReadiness } from '../../helper/isAccountReady';
import NotificationService from '../notification/notification.services';
import {
  ENUM_NOTIFICATION_TYPE,
  NOTIFICATION_ENTITY,
} from '../notification/notification.enum';
import { USER_ROLE } from '../user/user.constant';
import Booking from './booking.model';
import BookingFinancialOperation from './bookingFinancialOperation.model';
import BookingTransfer, {
  BOOKING_TRANSFER_PURPOSE,
  BOOKING_TRANSFER_STATUS,
  IBookingTransfer,
} from './bookingTransfer.model';

const stripe = new Stripe(config.stripe.stripe_secret_key as string);
const MAX_ATTEMPTS = 12;
const MAX_IDEMPOTENCY_WINDOW_MS = 23 * 60 * 60 * 1000;
const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_BACKOFF_MS = 6 * 60 * 60 * 1000;
const TRANSFER_BATCH_SIZE = 25;

type CreateBookingTransferInput = Pick<
  IBookingTransfer,
  | 'bookingId'
  | 'purpose'
  | 'destinationAccountId'
  | 'sourcePaymentIntentId'
  | 'amountInCents'
  | 'currency'
>;

const getErrorDetails = (error: unknown) => {
  const record =
    typeof error === 'object' && error !== null
      ? (error as Record<string, unknown>)
      : {};
  const message =
    error instanceof Error
      ? error.message
      : typeof record.message === 'string'
        ? record.message
        : 'Unknown Stripe transfer error';
  const statusCode =
    typeof record.statusCode === 'number' ? record.statusCode : undefined;
  const code = typeof record.code === 'string' ? record.code : undefined;
  const type = typeof record.type === 'string' ? record.type : undefined;
  const retryable =
    typeof record.retryable === 'boolean'
      ? record.retryable
      : statusCode === undefined ||
        statusCode === 429 ||
        statusCode >= 500 ||
        code === 'balance_insufficient' ||
        type === 'StripeConnectionError';

  return { message, retryable };
};

const notifyTransferFailure = async (
  transfer: IBookingTransfer & { _id: { toString(): string } },
) => {
  const booking = await Booking.findById(transfer.bookingId).select('shopId');
  if (!booking) {
    console.error(
      `Cannot notify about failed transfer ${transfer._id}: booking not found`,
    );
    return false;
  }

  const transferId = transfer._id.toString();
  const receivers = [booking.shopId.toString(), USER_ROLE.admin];
  let notificationsSent = true;
  for (const receiver of receivers) {
    try {
      await NotificationService.sendNotification({
        receiver,
        title: 'Booking transfer requires attention',
        message:
          'A booking transfer could not be completed after automatic retries. Please contact support or review the transfer.',
        type: ENUM_NOTIFICATION_TYPE.TRANSFER_FAILED,
        entity: NOTIFICATION_ENTITY.PAYMENT,
        entityId: transfer.bookingId,
        bookingId: transfer.bookingId,
        dedupeKey: `booking-transfer-failed-${transferId}-${transfer.retryCycle}-${receiver}`,
        meta: {
          bookingTransferId: transferId,
          purpose: transfer.purpose,
        },
      });
    } catch (error) {
      notificationsSent = false;
      console.error(
        `Failed to send transfer failure notification to ${receiver}:`,
        error,
      );
    }
  }
  return notificationsSent;
};

export const queueBookingTransfer = async (
  input: CreateBookingTransferInput,
) => {
  try {
    return await BookingTransfer.findOneAndUpdate(
      { bookingId: input.bookingId, purpose: input.purpose },
      { $setOnInsert: input },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    const duplicateKey =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000;
    if (!duplicateKey) throw error;

    const existingTransfer = await BookingTransfer.findOne({
      bookingId: input.bookingId,
      purpose: input.purpose,
    });
    if (!existingTransfer) throw error;
    if (
      existingTransfer.destinationAccountId !== input.destinationAccountId ||
      existingTransfer.sourcePaymentIntentId !== input.sourcePaymentIntentId ||
      existingTransfer.amountInCents !== input.amountInCents ||
      existingTransfer.currency !== input.currency
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        'An existing transfer for this booking has different financial details.',
      );
    }
    return existingTransfer;
  }
};

const markTransferFailed = async (
  transfer: IBookingTransfer & { _id: { toString(): string } },
  message: string,
  retryable: boolean,
) => {
  const now = new Date();
  const canRetry = retryable && transfer.attemptCount < MAX_ATTEMPTS;
  const backoffMs = Math.min(
    60_000 * 2 ** Math.max(transfer.attemptCount - 1, 0),
    MAX_BACKOFF_MS,
  );
  const updatedTransfer = await BookingTransfer.findOneAndUpdate(
    {
      _id: transfer._id,
      status: BOOKING_TRANSFER_STATUS.PROCESSING,
    },
    {
      $set: {
        status: canRetry
          ? BOOKING_TRANSFER_STATUS.PENDING
          : BOOKING_TRANSFER_STATUS.FAILED,
        nextAttemptAt: new Date(now.getTime() + backoffMs),
        lastError: message,
      },
      $unset: { processingStartedAt: 1 },
    },
    { new: true },
  );

  if (updatedTransfer && !canRetry) {
    const notificationsSent = await notifyTransferFailure(updatedTransfer);
    if (notificationsSent) {
      await BookingTransfer.updateOne(
        { _id: updatedTransfer._id },
        { $set: { failureAlertSentAt: new Date() } },
      );
    }
  }
};

const processBookingTransfer = async (transferId: string) => {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - PROCESSING_TIMEOUT_MS);
  const transfer = await BookingTransfer.findOneAndUpdate(
    {
      _id: transferId,
      $or: [
        {
          status: BOOKING_TRANSFER_STATUS.PENDING,
          nextAttemptAt: { $lte: now },
        },
        {
          status: BOOKING_TRANSFER_STATUS.PROCESSING,
          processingStartedAt: { $lte: staleBefore },
        },
      ],
    },
    {
      $set: {
        status: BOOKING_TRANSFER_STATUS.PROCESSING,
        processingStartedAt: now,
      },
      $inc: { attemptCount: 1 },
    },
    { new: true },
  );

  if (!transfer) return;

  try {
    const booking = await Booking.findById(transfer.bookingId).select('status');
    const financialOperation = await BookingFinancialOperation.findOne({
      bookingId: transfer.bookingId,
    }).select('disputeStatus');
    if (financialOperation?.disputeStatus === 'open') {
      const needsReview = await BookingTransfer.findOneAndUpdate(
        {
          _id: transfer._id,
          status: BOOKING_TRANSFER_STATUS.PROCESSING,
        },
        {
          $set: {
            status: BOOKING_TRANSFER_STATUS.NEEDS_REVIEW,
            lastError:
              'Transfer paused because the source payment has an open dispute.',
          },
          $unset: { processingStartedAt: 1 },
        },
        { new: true },
      );
      if (needsReview && (await notifyTransferFailure(needsReview))) {
        await BookingTransfer.updateOne(
          { _id: transfer._id },
          { $set: { failureAlertSentAt: new Date() } },
        );
      }
      return;
    }
    const requiredStatus =
      transfer.purpose === BOOKING_TRANSFER_PURPOSE.COMPLETION
        ? 'completed'
        : 'canceled';
    if (booking?.status === 'booked') {
      await BookingTransfer.findOneAndUpdate(
        {
          _id: transfer._id,
          status: BOOKING_TRANSFER_STATUS.PROCESSING,
        },
        {
          $set: {
            status: BOOKING_TRANSFER_STATUS.PENDING,
            nextAttemptAt: new Date(now.getTime() + 5 * 60 * 1000),
          },
          $inc: { attemptCount: -1 },
          $unset: { processingStartedAt: 1 },
        },
      );
      return;
    }
    if (!booking || booking.status !== requiredStatus) {
      throw Object.assign(
        new Error(
        booking
          ? `Booking must be ${requiredStatus} before its ${transfer.purpose} transfer`
          : 'Booking no longer exists',
        ),
        { retryable: false },
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      transfer.sourcePaymentIntentId,
      { expand: ['latest_charge'] },
    );
    const latestCharge = paymentIntent.latest_charge;
    const sourceTransaction =
      typeof latestCharge === 'string' ? latestCharge : latestCharge?.id;
    if (!sourceTransaction) {
      throw Object.assign(
        new Error('PaymentIntent has no successful charge to transfer from'),
        { retryable: false },
      );
    }

    const transferGroup = `booking-${transfer.bookingId.toString()}`;
    const existingTransfers = await stripe.transfers.list({
      transfer_group: transferGroup,
      limit: 100,
    });
    const existingTransfer = existingTransfers.data.find(
      (candidate) =>
        candidate.metadata.bookingTransferId === transfer._id.toString(),
    );
    if (existingTransfer) {
      if (
        existingTransfer.destination !== transfer.destinationAccountId ||
        existingTransfer.amount !== transfer.amountInCents ||
        existingTransfer.currency !== transfer.currency ||
        existingTransfer.source_transaction !== sourceTransaction
      ) {
        const needsReview = await BookingTransfer.findOneAndUpdate(
          {
            _id: transfer._id,
            status: BOOKING_TRANSFER_STATUS.PROCESSING,
          },
          {
            $set: {
              status: BOOKING_TRANSFER_STATUS.NEEDS_REVIEW,
              lastError:
                'Existing Stripe transfer does not match the queued amount or destination.',
            },
            $unset: { processingStartedAt: 1 },
          },
          { new: true },
        );
        if (needsReview && (await notifyTransferFailure(needsReview))) {
          await BookingTransfer.updateOne(
            { _id: transfer._id },
            { $set: { failureAlertSentAt: new Date() } },
          );
        }
        return;
      }

      const reversedAmount = existingTransfer.amount_reversed;
      const transferStatus = existingTransfer.reversed
        ? BOOKING_TRANSFER_STATUS.REVERSED
        : reversedAmount > 0
          ? BOOKING_TRANSFER_STATUS.PARTIALLY_REVERSED
          : BOOKING_TRANSFER_STATUS.SUCCEEDED;
      const updatedTransfer = await BookingTransfer.findOneAndUpdate(
        {
          _id: transfer._id,
          status: BOOKING_TRANSFER_STATUS.PROCESSING,
        },
        {
          $set: {
            status: transferStatus,
            stripeTransferId: existingTransfer.id,
            reversedAmountInCents: reversedAmount,
            ...(transferStatus === BOOKING_TRANSFER_STATUS.SUCCEEDED
              ? { lastError: null }
              : {
                  lastError:
                    'The existing Stripe transfer is reversed or partially reversed and requires manual review.',
                }),
          },
          $unset: { processingStartedAt: 1 },
        },
        { new: true },
      );
      if (
        updatedTransfer &&
        transferStatus !== BOOKING_TRANSFER_STATUS.SUCCEEDED &&
        (await notifyTransferFailure(updatedTransfer))
      ) {
        await BookingTransfer.updateOne(
          { _id: transfer._id },
          { $set: { failureAlertSentAt: new Date() } },
        );
      }
      return;
    }

    if (
      transfer.firstAttemptAt &&
      now.getTime() - transfer.firstAttemptAt.getTime() >
        MAX_IDEMPOTENCY_WINDOW_MS
    ) {
      const needsReview = await BookingTransfer.findOneAndUpdate(
        {
          _id: transfer._id,
          status: BOOKING_TRANSFER_STATUS.PROCESSING,
        },
        {
          $set: {
            status: BOOKING_TRANSFER_STATUS.NEEDS_REVIEW,
            lastError:
              'No matching transfer was found beyond Stripe idempotency retention; review the Stripe account before retrying.',
          },
          $unset: { processingStartedAt: 1 },
        },
        { new: true },
      );
      if (needsReview && (await notifyTransferFailure(needsReview))) {
        await BookingTransfer.updateOne(
          { _id: transfer._id },
          { $set: { failureAlertSentAt: new Date() } },
        );
      }
      return;
    }

    const readiness = await getStripeAccountReadiness(
      transfer.destinationAccountId,
    );
    if (!readiness.ready) {
      throw new Error(readiness.message);
    }

    if (!transfer.firstAttemptAt) {
      await BookingTransfer.updateOne(
        { _id: transfer._id, firstAttemptAt: { $exists: false } },
        { $set: { firstAttemptAt: now } },
      );
    }

    const latestOperation = await BookingFinancialOperation.findOne({
      bookingId: transfer.bookingId,
    }).select('disputeStatus');
    if (latestOperation?.disputeStatus === 'open') {
      await BookingTransfer.findOneAndUpdate(
        {
          _id: transfer._id,
          status: BOOKING_TRANSFER_STATUS.PROCESSING,
        },
        {
          $set: {
            status: BOOKING_TRANSFER_STATUS.NEEDS_REVIEW,
            lastError:
              'Transfer paused because the source payment has an open dispute.',
          },
          $unset: { processingStartedAt: 1 },
        },
      );
      return;
    }

    const stripeTransfer = await stripe.transfers.create(
        {
          amount: transfer.amountInCents,
          currency: transfer.currency,
          destination: transfer.destinationAccountId,
          source_transaction: sourceTransaction,
          transfer_group: transferGroup,
          metadata: {
            bookingId: transfer.bookingId.toString(),
            bookingTransferId: transfer._id.toString(),
            purpose: transfer.purpose,
          },
        },
        {
          idempotencyKey: `booking-transfer-${transfer._id.toString()}`,
        },
      );

    await BookingTransfer.findOneAndUpdate(
      { _id: transfer._id, status: BOOKING_TRANSFER_STATUS.PROCESSING },
      {
        $set: {
          status: BOOKING_TRANSFER_STATUS.SUCCEEDED,
          stripeTransferId: stripeTransfer.id,
          lastError: null,
        },
        $unset: { processingStartedAt: 1 },
      },
    );
  } catch (error) {
    const { message, retryable } = getErrorDetails(error);
    console.error(`Booking transfer ${transfer._id} failed:`, error);
    await markTransferFailed(transfer, message, retryable);
  }
};

const runPendingBookingTransfers = async () => {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - PROCESSING_TIMEOUT_MS);
  const pendingTransfers = await BookingTransfer.find({
    $or: [
      {
        status: BOOKING_TRANSFER_STATUS.PENDING,
        nextAttemptAt: { $lte: now },
      },
      {
        status: BOOKING_TRANSFER_STATUS.PROCESSING,
        processingStartedAt: { $lte: staleBefore },
      },
    ],
  })
    .sort({ nextAttemptAt: 1 })
    .limit(TRANSFER_BATCH_SIZE)
    .select('_id');

  for (const transfer of pendingTransfers) {
    await processBookingTransfer(transfer._id.toString());
  }
};

const runPendingTransferFailureAlerts = async () => {
  const failedTransfers = await BookingTransfer.find({
    status: {
      $in: [
        BOOKING_TRANSFER_STATUS.FAILED,
        BOOKING_TRANSFER_STATUS.NEEDS_REVIEW,
        BOOKING_TRANSFER_STATUS.REVERSED,
        BOOKING_TRANSFER_STATUS.PARTIALLY_REVERSED,
      ],
    },
    failureAlertSentAt: { $exists: false },
  })
    .sort({ updatedAt: 1 })
    .limit(TRANSFER_BATCH_SIZE);

  for (const transfer of failedTransfers) {
    if (await notifyTransferFailure(transfer)) {
      await BookingTransfer.updateOne(
        { _id: transfer._id, failureAlertSentAt: { $exists: false } },
        { $set: { failureAlertSentAt: new Date() } },
      );
    }
  }
};

export const getBookingTransfersNeedingAttention = async () =>
  BookingTransfer.find({
    status: {
      $in: [
        BOOKING_TRANSFER_STATUS.FAILED,
        BOOKING_TRANSFER_STATUS.NEEDS_REVIEW,
      ],
    },
  })
    .sort({ updatedAt: -1 })
    .limit(100)
    .populate('bookingId', 'shopId customerId totalPrice status');

export const retryFailedBookingTransfer = async (transferId: string) => {
  if (!mongoose.Types.ObjectId.isValid(transferId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid transfer ID');
  }

  const transfer = await BookingTransfer.findOneAndUpdate(
    { _id: transferId, status: BOOKING_TRANSFER_STATUS.FAILED },
    {
      $set: {
        status: BOOKING_TRANSFER_STATUS.PENDING,
        attemptCount: 0,
        nextAttemptAt: new Date(),
      },
      $inc: { retryCycle: 1 },
      $unset: {
        processingStartedAt: 1,
        failureAlertSentAt: 1,
      },
    },
    { new: true },
  );
  if (!transfer) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Transfer is not in a retryable failed state. Transfers needing review must first be reconciled in Stripe.',
    );
  }

  await processBookingTransfer(transfer._id.toString());
  return BookingTransfer.findById(transfer._id);
};

export const reconcileBookingTransfer = async (
  transferId: string,
  confirmNoMatchingTransfer = false,
) => {
  if (!mongoose.Types.ObjectId.isValid(transferId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid transfer ID');
  }

  const transfer = await BookingTransfer.findOne({
    _id: transferId,
    status: BOOKING_TRANSFER_STATUS.NEEDS_REVIEW,
  });
  if (!transfer) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Transfer is not waiting for manual reconciliation',
    );
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(
    transfer.sourcePaymentIntentId,
    { expand: ['latest_charge'] },
  );
  const latestCharge = paymentIntent.latest_charge;
  const sourceTransaction =
    typeof latestCharge === 'string' ? latestCharge : latestCharge?.id;
  if (!sourceTransaction) {
    throw new AppError(
      httpStatus.CONFLICT,
      'The original Stripe charge could not be found',
    );
  }

  const existingTransfers = await stripe.transfers.list({
    transfer_group: `booking-${transfer.bookingId.toString()}`,
    limit: 100,
  });
  const existingTransfer = existingTransfers.data.find(
    (candidate) =>
      candidate.metadata.bookingTransferId === transfer._id.toString(),
  );
  if (!existingTransfer) {
    if (
      transfer.firstAttemptAt &&
      Date.now() - transfer.firstAttemptAt.getTime() >
        MAX_IDEMPOTENCY_WINDOW_MS
    ) {
      if (!confirmNoMatchingTransfer) {
        return { reconciled: false, transfer };
      }
    }
    const resetIdempotencyWindow =
      transfer.firstAttemptAt &&
      Date.now() - transfer.firstAttemptAt.getTime() >
        MAX_IDEMPOTENCY_WINDOW_MS;
    const queuedTransfer = await BookingTransfer.findOneAndUpdate(
      { _id: transfer._id, status: BOOKING_TRANSFER_STATUS.NEEDS_REVIEW },
      {
        $set: {
          status: BOOKING_TRANSFER_STATUS.PENDING,
          nextAttemptAt: new Date(),
          ...(resetIdempotencyWindow ? { firstAttemptAt: new Date() } : {}),
        },
        $unset: { processingStartedAt: 1, failureAlertSentAt: 1 },
      },
      { new: true },
    );
    if (queuedTransfer) {
      await processBookingTransfer(queuedTransfer._id.toString());
    }
    return {
      reconciled: Boolean(queuedTransfer),
      transfer: queuedTransfer || transfer,
    };
  }
  if (
    existingTransfer.destination !== transfer.destinationAccountId ||
    existingTransfer.amount !== transfer.amountInCents ||
    existingTransfer.currency !== transfer.currency ||
    existingTransfer.source_transaction !== sourceTransaction
  ) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Stripe transfer details do not match the queued transfer; manual investigation is required.',
    );
  }

  const reversedAmount = existingTransfer.amount_reversed;
  const transferStatus = existingTransfer.reversed
    ? BOOKING_TRANSFER_STATUS.REVERSED
    : reversedAmount > 0
      ? BOOKING_TRANSFER_STATUS.PARTIALLY_REVERSED
      : BOOKING_TRANSFER_STATUS.SUCCEEDED;
  const updatedTransfer = await BookingTransfer.findOneAndUpdate(
    { _id: transfer._id, status: BOOKING_TRANSFER_STATUS.NEEDS_REVIEW },
    {
      $set: {
        status: transferStatus,
        stripeTransferId: existingTransfer.id,
        reversedAmountInCents: reversedAmount,
        ...(transferStatus === BOOKING_TRANSFER_STATUS.SUCCEEDED
          ? {}
          : {
              lastError:
                'The existing Stripe transfer is reversed or partially reversed and requires manual review.',
            }),
      },
      ...(transferStatus === BOOKING_TRANSFER_STATUS.SUCCEEDED
        ? { $unset: { lastError: 1, processingStartedAt: 1 } }
        : { $unset: { processingStartedAt: 1 } }),
    },
    { new: true },
  );
  if (
    updatedTransfer &&
    transferStatus !== BOOKING_TRANSFER_STATUS.SUCCEEDED &&
    (await notifyTransferFailure(updatedTransfer))
  ) {
    await BookingTransfer.updateOne(
      { _id: transfer._id },
      { $set: { failureAlertSentAt: new Date() } },
    );
  }
  return {
    reconciled:
      updatedTransfer?.status === BOOKING_TRANSFER_STATUS.SUCCEEDED,
    transfer: updatedTransfer,
  };
};

cron.schedule('*/2 * * * *', async () => {
  try {
    await runPendingBookingTransfers();
    await runPendingTransferFailureAlerts();
  } catch (error) {
    console.error('Booking transfer retry worker failed:', error);
  }
});

export const processQueuedBookingTransfer = processBookingTransfer;
