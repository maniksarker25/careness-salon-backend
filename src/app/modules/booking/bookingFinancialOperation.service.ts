import cron from 'node-cron';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import config from '../../config';
import AppError from '../../error/appError';
import NotificationService from '../notification/notification.services';
import {
  ENUM_NOTIFICATION_TYPE,
  NOTIFICATION_ENTITY,
} from '../notification/notification.enum';
import { USER_ROLE } from '../user/user.constant';
import Booking from './booking.model';
import BookingTransfer, {
  BOOKING_TRANSFER_PURPOSE,
  BOOKING_TRANSFER_STATUS,
} from './bookingTransfer.model';
import BookingFinancialOperation, {
  BOOKING_FINANCIAL_OPERATION_STATUS,
  BOOKING_FINANCIAL_OPERATION_TYPE,
  IBookingFinancialOperation,
} from './bookingFinancialOperation.model';
import {
  processQueuedBookingTransfer,
  reconcileBookingTransfer,
  queueBookingTransfer,
  retryFailedBookingTransfer,
} from './bookingTransfer.service';

const stripe = new Stripe(config.stripe.stripe_secret_key as string);
const MAX_ATTEMPTS = 12;
const MAX_IDEMPOTENCY_WINDOW_MS = 23 * 60 * 60 * 1000;
const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_BACKOFF_MS = 6 * 60 * 60 * 1000;
const BATCH_SIZE = 25;

type CreateOperationInput = Pick<
  IBookingFinancialOperation,
  | 'bookingId'
  | 'type'
  | 'sourcePaymentIntentId'
  | 'destinationAccountId'
  | 'refundAmountInCents'
  | 'transferAmountInCents'
  | 'currency'
>;

const getErrorDetails = (error: unknown) => {
  const record =
    typeof error === 'object' && error !== null
      ? (error as Record<string, unknown>)
      : {};
  const message =
    error instanceof Error ? error.message : 'Unknown Stripe refund error';
  const statusCode =
    typeof record.statusCode === 'number' ? record.statusCode : undefined;
  const code = typeof record.code === 'string' ? record.code : undefined;
  const retryable =
    typeof record.retryable === 'boolean'
      ? record.retryable
      : statusCode === undefined ||
        statusCode === 429 ||
        statusCode >= 500 ||
        code === 'balance_insufficient';
  return { message, retryable };
};

const notifyOperationFailure = async (
  operation: IBookingFinancialOperation & {
    _id: { toString(): string };
  },
) => {
  const booking = await Booking.findById(operation.bookingId).select('shopId');
  if (!booking) return false;
  let success = true;
  for (const receiver of [booking.shopId.toString(), USER_ROLE.admin]) {
    try {
      await NotificationService.sendNotification({
        receiver,
        title: 'Booking payment requires attention',
        message:
          'A booking financial operation could not be completed automatically. Please review the payment in Stripe.',
        type: ENUM_NOTIFICATION_TYPE.REFUND_FAILED,
        entity: NOTIFICATION_ENTITY.PAYMENT,
        entityId: operation.bookingId,
        bookingId: operation.bookingId,
        dedupeKey: `booking-refund-failed-${operation._id.toString()}-${receiver}`,
        meta: {
          bookingFinancialOperationId: operation._id.toString(),
        },
      });
    } catch (error) {
      success = false;
      console.error(`Failed to notify ${receiver} about refund failure:`, error);
    }
  }
  return success;
};

export const claimBookingFinancialOperation = async (
  input: CreateOperationInput,
) => {
  let operation;
  try {
    operation = await BookingFinancialOperation.create({
      ...input,
      refundStatus:
        input.refundAmountInCents > 0 ? 'pending' : 'not_required',
    });
  } catch (error) {
    const duplicateKey =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000;
    if (!duplicateKey) throw error;

    operation = await BookingFinancialOperation.findOne({
      bookingId: input.bookingId,
    });
    if (
      !operation ||
      operation.type !== input.type ||
      operation.sourcePaymentIntentId !== input.sourcePaymentIntentId ||
      operation.destinationAccountId !== input.destinationAccountId ||
      operation.refundAmountInCents !== input.refundAmountInCents ||
      operation.transferAmountInCents !== input.transferAmountInCents
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        'A different financial operation is already claimed for this booking.',
      );
    }
  }

  const targetStatus =
    input.type === BOOKING_FINANCIAL_OPERATION_TYPE.COMPLETION
      ? 'completed'
      : 'canceled';
  const booking = await Booking.findOneAndUpdate(
    { _id: input.bookingId, status: 'booked' },
    { $set: { status: targetStatus } },
    { new: true, runValidators: true },
  );
  if (!booking) {
    const currentBooking = await Booking.findById(input.bookingId).select(
      'status',
    );
    if (currentBooking?.status !== targetStatus) {
      await BookingFinancialOperation.updateOne(
        {
          _id: operation._id,
          status: BOOKING_FINANCIAL_OPERATION_STATUS.PENDING,
        },
        {
          $set: {
            status: BOOKING_FINANCIAL_OPERATION_STATUS.ABORTED,
            lastError: `Booking status is ${currentBooking?.status || 'missing'}; expected ${targetStatus}.`,
          },
        },
      );
      throw new AppError(
        httpStatus.CONFLICT,
        'Booking status changed before the financial operation was claimed.',
      );
    }
  }

  return operation;
};

const markOperationFailed = async (
  operation: IBookingFinancialOperation & { _id: mongoose.Types.ObjectId },
  message: string,
  retryable: boolean,
) => {
  const canRetry = retryable && operation.attemptCount < MAX_ATTEMPTS;
  const backoffMs = Math.min(
    60_000 * 2 ** Math.max(operation.attemptCount - 1, 0),
    MAX_BACKOFF_MS,
  );
  const updated = await BookingFinancialOperation.findOneAndUpdate(
    {
      _id: operation._id,
      status: BOOKING_FINANCIAL_OPERATION_STATUS.PROCESSING,
    },
    {
      $set: {
        status: canRetry
          ? BOOKING_FINANCIAL_OPERATION_STATUS.PENDING
          : BOOKING_FINANCIAL_OPERATION_STATUS.FAILED,
        ...(operation.refundAmountInCents > 0 && !operation.stripeRefundId
          ? { refundStatus: canRetry ? 'pending' : 'failed' }
          : {}),
        nextAttemptAt: new Date(Date.now() + backoffMs),
        lastError: message,
      },
      $unset: { processingStartedAt: 1 },
    },
    { new: true },
  );
  if (
    updated &&
    !canRetry &&
    updated.refundAmountInCents > 0 &&
    (await notifyOperationFailure(updated))
  ) {
    await BookingFinancialOperation.updateOne(
      { _id: updated._id },
      { $set: { failureAlertSentAt: new Date() } },
    );
  }
};

const processRefund = async (
  operation: IBookingFinancialOperation & { _id: mongoose.Types.ObjectId },
) => {
  if (operation.refundAmountInCents <= 0) return;
  if (!operation.sourcePaymentIntentId) {
    throw Object.assign(
      new Error('Booking financial operation has no PaymentIntent ID'),
      { retryable: false },
    );
  }

  const now = new Date();
  const paymentIntent = await stripe.paymentIntents.retrieve(
    operation.sourcePaymentIntentId,
  );
  if (paymentIntent.status !== 'succeeded') {
    throw Object.assign(new Error('PaymentIntent is not succeeded'), {
      retryable: false,
    });
  }

  const refunds = await stripe.refunds.list({
    payment_intent: operation.sourcePaymentIntentId,
    limit: 100,
  });
  const existingRefund = refunds.data.find(
    (refund) =>
      refund.metadata?.bookingFinancialOperationId ===
      operation._id.toString(),
  );
  if (existingRefund) {
    if (existingRefund.amount !== operation.refundAmountInCents) {
      throw Object.assign(
        new Error('Existing Stripe refund amount does not match the operation'),
        { retryable: false },
      );
    }
    if (
      existingRefund.status === 'failed' ||
      existingRefund.status === 'canceled'
    ) {
      await BookingFinancialOperation.updateOne(
        { _id: operation._id },
        {
          $set: {
            status: BOOKING_FINANCIAL_OPERATION_STATUS.NEEDS_REVIEW,
            refundStatus: 'needs_review',
            stripeRefundId: existingRefund.id,
            lastError: `Stripe refund is ${existingRefund.status}; manual review is required.`,
          },
          $unset: { processingStartedAt: 1 },
        },
      );
      return;
    }

    await BookingFinancialOperation.updateOne(
      { _id: operation._id },
      {
        $set: {
          refundStatus:
            existingRefund.status === 'succeeded' ? 'succeeded' : 'pending',
          stripeRefundId: existingRefund.id,
        },
      },
    );
    if (existingRefund.status !== 'succeeded') {
      throw new Error(`Stripe refund is ${existingRefund.status}`);
    }
    return;
  }

  if (
    operation.firstAttemptAt &&
    now.getTime() - operation.firstAttemptAt.getTime() >
      MAX_IDEMPOTENCY_WINDOW_MS
  ) {
    await BookingFinancialOperation.updateOne(
      { _id: operation._id },
      {
        $set: {
          status: BOOKING_FINANCIAL_OPERATION_STATUS.NEEDS_REVIEW,
          refundStatus: 'needs_review',
          lastError:
            'No matching refund was found beyond Stripe idempotency retention; manual review is required.',
        },
        $unset: { processingStartedAt: 1 },
      },
    );
    return;
  }

  if (!operation.firstAttemptAt) {
    await BookingFinancialOperation.updateOne(
      { _id: operation._id, firstAttemptAt: { $exists: false } },
      { $set: { firstAttemptAt: now } },
    );
  }

  const refund = await stripe.refunds.create(
    {
      payment_intent: operation.sourcePaymentIntentId,
      amount: operation.refundAmountInCents,
      metadata: {
        bookingId: operation.bookingId.toString(),
        bookingFinancialOperationId: operation._id.toString(),
      },
    },
    { idempotencyKey: `booking-refund-${operation._id.toString()}` },
  );
  await BookingFinancialOperation.updateOne(
    { _id: operation._id },
    {
      $set: {
        refundStatus: refund.status === 'succeeded' ? 'succeeded' : 'pending',
        stripeRefundId: refund.id,
      },
    },
  );
  if (refund.status !== 'succeeded') {
    throw new Error(`Stripe refund is ${refund.status}`);
  }
};

const processFinancialOperation = async (operationId: string) => {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - PROCESSING_TIMEOUT_MS);
  const operation = await BookingFinancialOperation.findOneAndUpdate(
    {
      _id: operationId,
      $or: [
        {
          status: BOOKING_FINANCIAL_OPERATION_STATUS.PENDING,
          nextAttemptAt: { $lte: now },
        },
        {
          status: BOOKING_FINANCIAL_OPERATION_STATUS.PROCESSING,
          processingStartedAt: { $lte: staleBefore },
        },
      ],
    },
    {
      $set: {
        status: BOOKING_FINANCIAL_OPERATION_STATUS.PROCESSING,
        processingStartedAt: now,
      },
      $inc: { attemptCount: 1 },
    },
    { new: true },
  );
  if (!operation) return;

  try {
    const targetStatus =
      operation.type === BOOKING_FINANCIAL_OPERATION_TYPE.COMPLETION
        ? 'completed'
        : 'canceled';
    const booking = await Booking.findOneAndUpdate(
      { _id: operation.bookingId, status: 'booked' },
      { $set: { status: targetStatus } },
      { new: true },
    );
    if (!booking) {
      const currentBooking = await Booking.findById(
        operation.bookingId,
      ).select('status');
      if (currentBooking?.status !== targetStatus) {
        throw Object.assign(
          new Error(
            `Booking status is ${currentBooking?.status || 'missing'}; expected ${targetStatus}.`,
          ),
          { retryable: false },
        );
      }
    }

    if (operation.disputeStatus === 'open') {
      await BookingFinancialOperation.findOneAndUpdate(
        {
          _id: operation._id,
          status: BOOKING_FINANCIAL_OPERATION_STATUS.PROCESSING,
        },
        {
          $set: {
            status: BOOKING_FINANCIAL_OPERATION_STATUS.NEEDS_REVIEW,
            lastError:
              'An open dispute exists for this booking payment; financial processing is paused for manual review.',
          },
          $unset: { processingStartedAt: 1 },
        },
      );
      return;
    }

    if (operation.refundAmountInCents > 0) {
      await processRefund(operation);
      const refreshed = await BookingFinancialOperation.findById(operation._id);
      if (
        refreshed?.status === BOOKING_FINANCIAL_OPERATION_STATUS.NEEDS_REVIEW
      ) {
        return;
      }
      const afterRefund = await BookingFinancialOperation.findById(
        operation._id,
      ).select('refundStatus');
      if (afterRefund?.refundStatus !== 'succeeded') {
        await BookingFinancialOperation.findOneAndUpdate(
          {
            _id: operation._id,
            status: BOOKING_FINANCIAL_OPERATION_STATUS.PROCESSING,
            disputeStatus: { $ne: 'open' },
          },
          {
            $set: {
              status: BOOKING_FINANCIAL_OPERATION_STATUS.PENDING,
              nextAttemptAt: new Date(Date.now() + 2 * 60 * 1000),
            },
            $unset: { processingStartedAt: 1 },
            $inc: { attemptCount: -1 },
          },
        );
        return;
      }
    }

    const currentOperation = await BookingFinancialOperation.findById(
      operation._id,
    ).select('status disputeStatus');
    if (
      currentOperation?.disputeStatus === 'open' ||
      currentOperation?.status === BOOKING_FINANCIAL_OPERATION_STATUS.NEEDS_REVIEW
    ) {
      return;
    }

    if (operation.transferAmountInCents > 0) {
      if (!operation.destinationAccountId || !operation.sourcePaymentIntentId) {
        throw Object.assign(
          new Error('Transfer destination or PaymentIntent is missing'),
          { retryable: false },
        );
      }
      const transfer = await queueBookingTransfer({
        bookingId: operation.bookingId,
        purpose:
          operation.type === BOOKING_FINANCIAL_OPERATION_TYPE.COMPLETION
            ? BOOKING_TRANSFER_PURPOSE.COMPLETION
            : BOOKING_TRANSFER_PURPOSE.CANCELLATION,
        destinationAccountId: operation.destinationAccountId,
        sourcePaymentIntentId: operation.sourcePaymentIntentId,
        amountInCents: operation.transferAmountInCents,
        currency: operation.currency,
      });
      await processQueuedBookingTransfer(transfer._id.toString());
      const refreshedTransfer = await BookingTransfer.findById(transfer._id);
      if (
        refreshedTransfer?.status === BOOKING_TRANSFER_STATUS.FAILED ||
        refreshedTransfer?.status === BOOKING_TRANSFER_STATUS.NEEDS_REVIEW ||
        refreshedTransfer?.status === BOOKING_TRANSFER_STATUS.REVERSED ||
        refreshedTransfer?.status ===
          BOOKING_TRANSFER_STATUS.PARTIALLY_REVERSED
      ) {
        await BookingFinancialOperation.findOneAndUpdate(
          {
            _id: operation._id,
            status: BOOKING_FINANCIAL_OPERATION_STATUS.PROCESSING,
          },
          {
          $set: {
            status:
              refreshedTransfer.status !== BOOKING_TRANSFER_STATUS.FAILED
                ? BOOKING_FINANCIAL_OPERATION_STATUS.NEEDS_REVIEW
                : BOOKING_FINANCIAL_OPERATION_STATUS.FAILED,
            lastError: refreshedTransfer.lastError,
          },
          $unset: { processingStartedAt: 1 },
          },
        );
        return;
      }
      if (refreshedTransfer?.status !== BOOKING_TRANSFER_STATUS.SUCCEEDED) {
        await BookingFinancialOperation.findOneAndUpdate(
          {
            _id: operation._id,
            status: BOOKING_FINANCIAL_OPERATION_STATUS.PROCESSING,
            disputeStatus: { $ne: 'open' },
          },
          {
            $set: {
              status: BOOKING_FINANCIAL_OPERATION_STATUS.PENDING,
              nextAttemptAt: new Date(Date.now() + 2 * 60 * 1000),
            },
            $unset: { processingStartedAt: 1 },
            $inc: { attemptCount: -1 },
          },
        );
        return;
      }
    }

    await BookingFinancialOperation.findOneAndUpdate(
      {
        _id: operation._id,
        status: BOOKING_FINANCIAL_OPERATION_STATUS.PROCESSING,
      },
      {
        $set: { status: BOOKING_FINANCIAL_OPERATION_STATUS.SUCCEEDED },
        $unset: { processingStartedAt: 1, lastError: 1 },
      },
    );
  } catch (error) {
    const details = getErrorDetails(error);
    console.error(`Booking financial operation ${operation._id} failed:`, error);
    const latestOperation = await BookingFinancialOperation.findById(
      operation._id,
    );
    await markOperationFailed(
      latestOperation || operation,
      details.message,
      details.retryable,
    );
  }
};

export const processBookingFinancialOperation = processFinancialOperation;

const runPendingOperations = async () => {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - PROCESSING_TIMEOUT_MS);
  const operations = await BookingFinancialOperation.find({
    $or: [
      {
        status: BOOKING_FINANCIAL_OPERATION_STATUS.PENDING,
        nextAttemptAt: { $lte: now },
      },
      {
        status: BOOKING_FINANCIAL_OPERATION_STATUS.PROCESSING,
        processingStartedAt: { $lte: staleBefore },
      },
    ],
  })
    .sort({ nextAttemptAt: 1 })
    .limit(BATCH_SIZE)
    .select('_id');
  for (const operation of operations) {
    await processFinancialOperation(operation._id.toString());
  }
};

const runPendingOperationFailureAlerts = async () => {
  const operations = await BookingFinancialOperation.find({
    refundAmountInCents: { $gt: 0 },
    status: {
      $in: [
        BOOKING_FINANCIAL_OPERATION_STATUS.FAILED,
        BOOKING_FINANCIAL_OPERATION_STATUS.NEEDS_REVIEW,
      ],
    },
    failureAlertSentAt: { $exists: false },
  })
    .sort({ updatedAt: 1 })
    .limit(BATCH_SIZE);

  for (const operation of operations) {
    if (await notifyOperationFailure(operation)) {
      await BookingFinancialOperation.updateOne(
        { _id: operation._id, failureAlertSentAt: { $exists: false } },
        { $set: { failureAlertSentAt: new Date() } },
      );
    }
  }
};

export const getFinancialOperationsNeedingAttention = async () =>
  BookingFinancialOperation.find({
    status: {
      $in: [
        BOOKING_FINANCIAL_OPERATION_STATUS.FAILED,
        BOOKING_FINANCIAL_OPERATION_STATUS.NEEDS_REVIEW,
      ],
    },
  })
    .sort({ updatedAt: -1 })
    .limit(100)
    .populate('bookingId', 'shopId customerId totalPrice status');

export const retryFinancialOperation = async (operationId: string) => {
  if (!mongoose.Types.ObjectId.isValid(operationId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid operation ID');
  }
  const existingOperation = await BookingFinancialOperation.findOne(
    {
      _id: operationId,
      status: BOOKING_FINANCIAL_OPERATION_STATUS.FAILED,
    },
  );
  if (!existingOperation) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Operation is not retryable; reconcile it in Stripe first if its outcome is uncertain.',
    );
  }
  const transferPurpose =
    existingOperation.type === BOOKING_FINANCIAL_OPERATION_TYPE.COMPLETION
      ? BOOKING_TRANSFER_PURPOSE.COMPLETION
      : BOOKING_TRANSFER_PURPOSE.CANCELLATION;
  const existingTransfer = await BookingTransfer.findOne({
    bookingId: existingOperation.bookingId,
    purpose: transferPurpose,
  });
  if (
    existingTransfer?.status === BOOKING_TRANSFER_STATUS.NEEDS_REVIEW ||
    existingTransfer?.status === BOOKING_TRANSFER_STATUS.REVERSED ||
    existingTransfer?.status ===
      BOOKING_TRANSFER_STATUS.PARTIALLY_REVERSED
  ) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Transfer needs Stripe reconciliation and cannot be retried automatically.',
    );
  }
  if (existingTransfer?.status === BOOKING_TRANSFER_STATUS.FAILED) {
    await retryFailedBookingTransfer(existingTransfer._id.toString());
  }
  const operation = await BookingFinancialOperation.findOneAndUpdate(
    {
      _id: operationId,
      status: BOOKING_FINANCIAL_OPERATION_STATUS.FAILED,
    },
    {
      $set: {
        status: BOOKING_FINANCIAL_OPERATION_STATUS.PENDING,
        attemptCount: 0,
        nextAttemptAt: new Date(),
      },
    },
    { new: true },
  );
  if (!operation) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Operation status changed before the retry was started.',
    );
  }
  await processFinancialOperation(operation._id.toString());
  return BookingFinancialOperation.findById(operation._id);
};

export const reconcileFinancialOperation = async (
  operationId: string,
  confirmations: {
    noMatchingRefund?: boolean;
    noMatchingTransfer?: boolean;
  } = {},
) => {
  if (!mongoose.Types.ObjectId.isValid(operationId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid operation ID');
  }
  const operation = await BookingFinancialOperation.findOne({
    _id: operationId,
    status: BOOKING_FINANCIAL_OPERATION_STATUS.NEEDS_REVIEW,
  });
  if (!operation) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Operation is not waiting for reconciliation',
    );
  }
  if (operation.disputeStatus === 'open') {
    throw new AppError(
      httpStatus.CONFLICT,
      'The payment has an open dispute and cannot be reconciled yet',
    );
  }

  const transferPurpose =
    operation.type === BOOKING_FINANCIAL_OPERATION_TYPE.COMPLETION
      ? BOOKING_TRANSFER_PURPOSE.COMPLETION
      : BOOKING_TRANSFER_PURPOSE.CANCELLATION;
  const existingTransfer = await BookingTransfer.findOne({
    bookingId: operation.bookingId,
    purpose: transferPurpose,
  });
  if (
    existingTransfer?.status === BOOKING_TRANSFER_STATUS.REVERSED ||
    existingTransfer?.status === BOOKING_TRANSFER_STATUS.PARTIALLY_REVERSED
  ) {
    throw new AppError(
      httpStatus.CONFLICT,
      'A reversed transfer requires manual financial review; it cannot be retried automatically.',
    );
  }
  if (
    existingTransfer?.status === BOOKING_TRANSFER_STATUS.NEEDS_REVIEW
  ) {
    const reconciled = await reconcileBookingTransfer(
      existingTransfer._id.toString(),
      confirmations.noMatchingTransfer,
    );
    if (!reconciled.reconciled) {
      return BookingFinancialOperation.findById(operation._id);
    }
  }

  if (operation.refundAmountInCents > 0) {
    if (!operation.sourcePaymentIntentId) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Operation has no PaymentIntent ID',
      );
    }
    const refunds = await stripe.refunds.list({
      payment_intent: operation.sourcePaymentIntentId,
      limit: 100,
    });
    const matchingRefund = refunds.data.find(
      (refund) =>
        refund.metadata?.bookingFinancialOperationId === operation._id.toString(),
    );
    if (matchingRefund) {
      if (matchingRefund.amount !== operation.refundAmountInCents) {
        throw new AppError(
          httpStatus.CONFLICT,
          'Stripe refund amount does not match the recorded operation',
        );
      }
      if (matchingRefund.status !== 'succeeded') {
        throw new AppError(
          httpStatus.CONFLICT,
          `Stripe refund is ${matchingRefund.status}; manual review is required`,
        );
      }
      await BookingFinancialOperation.updateOne(
        { _id: operation._id },
        {
          $set: {
            stripeRefundId: matchingRefund.id,
            refundStatus: 'succeeded',
            status: BOOKING_FINANCIAL_OPERATION_STATUS.PENDING,
            nextAttemptAt: new Date(),
          },
          $unset: { lastError: 1, failureAlertSentAt: 1 },
        },
      );
      await processFinancialOperation(operation._id.toString());
      return BookingFinancialOperation.findById(operation._id);
    }
  }

  const resetRefundIdempotencyWindow =
    operation.firstAttemptAt &&
    Date.now() - operation.firstAttemptAt.getTime() >
      MAX_IDEMPOTENCY_WINDOW_MS;
  if (resetRefundIdempotencyWindow && !confirmations.noMatchingRefund) {
    throw new AppError(
      httpStatus.CONFLICT,
      'No matching Stripe refund was found beyond the idempotency window. Confirm in Stripe Dashboard and retry with noMatchingRefund=true.',
    );
  }

  if (operation.disputeStatus === 'won' || !operation.disputeId) {
    await BookingFinancialOperation.updateOne(
      { _id: operation._id },
      {
        $set: {
          status: BOOKING_FINANCIAL_OPERATION_STATUS.PENDING,
          nextAttemptAt: new Date(),
          ...(resetRefundIdempotencyWindow
            ? { firstAttemptAt: new Date() }
            : {}),
        },
        $unset: { lastError: 1, failureAlertSentAt: 1 },
      },
    );
    await processFinancialOperation(operation._id.toString());
  }
  return BookingFinancialOperation.findById(operation._id);
};

cron.schedule('*/2 * * * *', async () => {
  try {
    await runPendingOperations();
    await runPendingOperationFailureAlerts();
  } catch (error) {
    console.error('Booking financial operation worker failed:', error);
  }
});
