import { Schema, model } from 'mongoose';

const deviceSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    playerId: {
      type: String,
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

deviceSchema.index({ userId: 1, playerId: 1 }, { unique: true });

export const Device = model('Device', deviceSchema);
