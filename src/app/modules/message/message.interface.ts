import { Types } from 'mongoose';
import { TChatParticipantModel } from '../conversation/conversation.interface';

export interface IMessage {
  text?: string;
  imageUrl?: string[];
  videoUrl?: string[];
  pdfUrl?: string[];
  // Profile ids (Customer._id / Client._id)
  msgByUserId: Types.ObjectId;
  msgByUserModel: TChatParticipantModel;
  receiverId: Types.ObjectId;
  receiverModel: TChatParticipantModel;
  conversationId: Types.ObjectId;
  seen?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
