import { Types } from 'mongoose';
import { ENUM_PAYMENT_METHOD } from '../../utilities/enum';

export interface ITransaction {
  senderEntityId?: Types.ObjectId;
  receiverEntityId?: Types.ObjectId;
  senderEntityType?: 'Customer' | 'Client';
  receiverEntityType?: 'Customer' | 'Client';
  amount: number;
  type: 'Booking' | 'Refund' | 'Shop Charge';
  paymentMethod: (typeof ENUM_PAYMENT_METHOD)[keyof typeof ENUM_PAYMENT_METHOD];
  transactionId: string;
  status: 'pending' | 'success';
}
