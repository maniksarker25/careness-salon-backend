import { Types } from 'mongoose';

// Chat is between a Customer and a Client (shop owner). Participants are the
// PROFILE ids (Customer._id / Client._id), not the User ids.
export type TChatParticipantModel = 'Customer' | 'Client';

export interface IConversation {
  // [customerOrClientId, customerOrClientId]; same order as participantsModel
  participants: Types.ObjectId[];
  participantsModel: TChatParticipantModel[];
  // The two participant ids, sorted and joined with ':'. Unique per pair, so a
  // pair of users can never end up with two conversations.
  participantKey: string;
  lastMessage?: Types.ObjectId | null;
  // Used to sort the chat list without loading any messages
  lastMessageAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
