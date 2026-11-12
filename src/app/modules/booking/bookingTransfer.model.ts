import { model, Schema, Types } from 'mongoose';

export const BOOKING_TRANSFER_PURPOSE = {
  COMPLETION: 'completion',
  CANCELLATION: 'cancellation',
} as const;

export const BOOKING_TRANSFER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  NEEDS_REVIEW: 'needs_review',
  REVERSED: 'reversed',
  PARTIALLY_REVERSED: 'partially_reversed',
} as const;

export interface IBookingTransfer {
  bookingId: Types.ObjectId;
  purpose: (typeof BOOKING_TRANSFER_PURPOSE)[keyof typeof BOOKING_TRANSFER_PURPOSE];
  destinationAccountId: string;
  sourcePaymentIntentId: string;
  amountInCents: number;
  currency: string;
  status: (typeof BOOKING_TRANSFER_STATUS)[keyof typeof BOOKING_TRANSFER_STATUS];
  attemptCount: number;
  retryCycle: number;
  nextAttemptAt: Date;
  processingStartedAt?: Date;
  firstAttemptAt?: Date;
  lastError?: string;
  stripeTransferId?: string;
  reversedAmountInCents?: number;
  disputeId?: string;
  disputeStatus?: 'open' | 'won' | 'lost';
  failureAlertSentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const bookingTransferSchema = new Schema<IBookingTransfer>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    purpose: {
      type: String,
      enum: Object.values(BOOKING_TRANSFER_PURPOSE),
      required: true,
    },
    destinationAccountId: { type: String, required: true },
    sourcePaymentIntentId: { type: String, required: true },
    amountInCents: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, lowercase: true },
    status: {
      type: String,
      enum: Object.values(BOOKING_TRANSFER_STATUS),
      default: BOOKING_TRANSFER_STATUS.PENDING,
      required: true,
    },
    attemptCount: { type: Number, default: 0, required: true },
    retryCycle: { type: Number, default: 0, required: true },
    nextAttemptAt: { type: Date, default: Date.now, required: true },
    processingStartedAt: Date,
    firstAttemptAt: Date,
    lastError: String,
    stripeTransferId: String,
    reversedAmountInCents: { type: Number, min: 0 },
    disputeId: String,
    disputeStatus: { type: String, enum: ['open', 'won', 'lost'] },
    failureAlertSentAt: Date,
  },
  { timestamps: true },
);

bookingTransferSchema.index(
  { bookingId: 1, purpose: 1 },
  { unique: true },
);
bookingTransferSchema.index({ status: 1, nextAttemptAt: 1 });
bookingTransferSchema.index({ status: 1, processingStartedAt: 1 });

export default model<IBookingTransfer>(
  'BookingTransfer',
  bookingTransferSchema,
);
