import { model, Schema } from 'mongoose';
import { IConversation } from './conversation.interface';

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'participantsModel',
      },
    ],
    participantsModel: [
      {
        type: String,
        required: true,
        enum: ['Customer', 'Client'],
      },
    ],
    participantKey: {
      type: String,
      required: true,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// One conversation per pair. The partial filter lets legacy documents (the old
// sender/receiver/messages[] format, which have no participantKey) coexist
// until scripts/migrateChat.ts converts them.
conversationSchema.index(
  { participantKey: 1 },
  {
    unique: true,
    partialFilterExpression: { participantKey: { $type: 'string' } },
  },
);
// Chat list of a user, newest first
conversationSchema.index({ participants: 1, lastMessageAt: -1, updatedAt: -1 });

const Conversation = model<IConversation>('Conversation', conversationSchema);

export default Conversation;
