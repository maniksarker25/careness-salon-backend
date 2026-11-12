import { model, Schema, Types } from 'mongoose';

export const BOOKING_FINANCIAL_OPERATION_TYPE = {
  COMPLETION: 'completion',
  CANCELLATION: 'cancellation',
} as const;

export const BOOKING_FINANCIAL_OPERATION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  NEEDS_REVIEW: 'needs_review',
  ABORTED: 'aborted',
} as const;

export interface IBookingFinancialOperation {
  bookingId: Types.ObjectId;
  type: (typeof BOOKING_FINANCIAL_OPERATION_TYPE)[keyof typeof BOOKING_FINANCIAL_OPERATION_TYPE];
  sourcePaymentIntentId?: string;
  destinationAccountId?: string;
  refundAmountInCents: number;
  transferAmountInCents: number;
  currency: string;
  status: (typeof BOOKING_FINANCIAL_OPERATION_STATUS)[keyof typeof BOOKING_FINANCIAL_OPERATION_STATUS];
  refundStatus: 'not_required' | 'pending' | 'succeeded' | 'failed' | 'needs_review';
  stripeRefundId?: string;
  failureAlertSentAt?: Date;
  disputeId?: string;
  disputeStatus?: 'open' | 'won' | 'lost';
  attemptCount: number;
  firstAttemptAt?: Date;
  nextAttemptAt: Date;
  processingStartedAt?: Date;
  lastError?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const bookingFinancialOperationSchema =
  new Schema<IBookingFinancialOperation>(
    {
      bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true,
      },
      type: {
        type: String,
        enum: Object.values(BOOKING_FINANCIAL_OPERATION_TYPE),
        required: true,
      },
      sourcePaymentIntentId: String,
      destinationAccountId: String,
      refundAmountInCents: { type: Number, default: 0, min: 0, required: true },
      transferAmountInCents: { type: Number, default: 0, min: 0, required: true },
      currency: { type: String, default: 'eur', lowercase: true, required: true },
      status: {
        type: String,
        enum: Object.values(BOOKING_FINANCIAL_OPERATION_STATUS),
        default: BOOKING_FINANCIAL_OPERATION_STATUS.PENDING,
        required: true,
      },
      refundStatus: {
        type: String,
        enum: ['not_required', 'pending', 'succeeded', 'failed', 'needs_review'],
        default: 'not_required',
        required: true,
      },
      stripeRefundId: String,
      failureAlertSentAt: Date,
      disputeId: String,
      disputeStatus: { type: String, enum: ['open', 'won', 'lost'] },
      attemptCount: { type: Number, default: 0, required: true },
      firstAttemptAt: Date,
      nextAttemptAt: { type: Date, default: Date.now, required: true },
      processingStartedAt: Date,
      lastError: String,
    },
    { timestamps: true },
  );

bookingFinancialOperationSchema.index({ status: 1, nextAttemptAt: 1 });
bookingFinancialOperationSchema.index({ status: 1, processingStartedAt: 1 });

export default model<IBookingFinancialOperation>(
  'BookingFinancialOperation',
  bookingFinancialOperationSchema,
);
