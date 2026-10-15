import mongoose, { Schema } from 'mongoose';
import { NOTIFICATION_ACTION, NOTIFICATION_ENTITY } from './notification.enum';

const notificationSchema = new Schema(
  {
    receiver: {
      type: String,
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    image: {
      type: String,
    },

    data: {
      entity: { type: String, enum: Object.values(NOTIFICATION_ENTITY) },
      action: { type: String, enum: Object.values(NOTIFICATION_ACTION) },
      entityId: { type: Schema.Types.ObjectId },
      meta: {
        type: Schema.Types.Mixed,
      },
    },

    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },

    rescheduleDateTime: {
      type: Date,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
    },

    isSeen: {
      type: Boolean,
      default: false,
    },

    seenAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ receiver: 1, isRead: 1 });
notificationSchema.index({ receiver: 1, createdAt: -1 });

//  auto delete after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('Notification', notificationSchema);
