import { model, Schema } from 'mongoose';
import { IMessage } from './message.interface';

const messageSchema = new Schema<IMessage>(
  {
    text: { type: String, default: '' },
    imageUrl: { type: [String], default: [] },
    videoUrl: { type: [String], default: [] },
    pdfUrl: { type: [String], default: [] },
    msgByUserId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'msgByUserModel',
    },
    msgByUserModel: {
      type: String,
      required: true,
      enum: ['Customer', 'Client'],
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'receiverModel',
    },
    receiverModel: {
      type: String,
      required: true,
      enum: ['Customer', 'Client'],
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Message history of a conversation (newest first, paginated)
messageSchema.index({ conversationId: 1, createdAt: -1 });
// Mark-as-seen and per-conversation unseen counts
messageSchema.index({ conversationId: 1, receiverId: 1, seen: 1 });
// Total unseen conversations badge
messageSchema.index({ receiverId: 1, seen: 1, createdAt: -1 });

const Message = model<IMessage>('Message', messageSchema);

export default Message;
