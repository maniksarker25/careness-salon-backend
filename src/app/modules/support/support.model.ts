import { Schema, model } from 'mongoose';

export const SUPPORT_TICKET_STATUS = ['pending', 'processing', 'resolved'] as const;
export type TSupportTicketStatus = (typeof SUPPORT_TICKET_STATUS)[number];

export const SUPPORT_USER_TYPES = ['customer', 'salon', 'other'] as const;

export interface ISupportTicket {
  name: string;
  email: string;
  phone?: string;
  userType?: (typeof SUPPORT_USER_TYPES)[number];
  message: string;
  status: TSupportTicketStatus;
  adminNote?: string;
  emailDelivered: boolean;
  statusChangedAt?: Date;
  resolvedAt?: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30 },
    userType: { type: String, enum: SUPPORT_USER_TYPES },
    message: { type: String, required: true, maxlength: 5000 },
    status: {
      type: String,
      enum: SUPPORT_TICKET_STATUS,
      default: 'pending',
      index: true,
    },
    adminNote: { type: String, trim: true, maxlength: 2000 },
    // Whether the copy to the support inbox was sent; the ticket is kept
    // either way so no message is lost.
    emailDelivered: { type: Boolean, default: false },
    statusChangedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

supportTicketSchema.index({ status: 1, createdAt: -1 });

export const SupportTicket = model<ISupportTicket>(
  'SupportTicket',
  supportTicketSchema,
);
