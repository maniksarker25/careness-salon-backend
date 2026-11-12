import { model, Schema } from 'mongoose';

const stripeWebhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    status: {
      type: String,
      enum: ['processing', 'processed'],
      default: 'processing',
      required: true,
    },
    processingStartedAt: { type: Date, default: Date.now, required: true },
    processedAt: Date,
    lastError: String,
  },
  { timestamps: true },
);

stripeWebhookEventSchema.index({ status: 1, processingStartedAt: 1 });

export default model('StripeWebhookEvent', stripeWebhookEventSchema);
