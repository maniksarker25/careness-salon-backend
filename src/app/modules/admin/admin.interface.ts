import { Types } from 'mongoose';

export interface IAdmin {
  _id: string;
  user: Types.ObjectId;
  name: string;
  email: string;
  phoneNumber: string;
  profile_image: string;
  bankName: string;
  accountName: string;
  accountNumber: number;
  branchCode: number;
  status: 'active' | 'inactive';
  isDeleted: boolean;
}
