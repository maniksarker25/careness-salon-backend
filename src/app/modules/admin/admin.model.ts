import { Schema, model } from 'mongoose';
import formatPhoneNumber from '../../utilities/formatPhoneNumber';
import { IAdmin } from './admin.interface';

const adminSchema = new Schema<IAdmin>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      default: '',
      set: formatPhoneNumber,
    },
    profile_image: {
      type: String,
      default: '',
    },
    bankName: {
      type: String,
      default: '',
    },
    accountName: {
      type: String,
      default: '',
    },
    accountNumber: {
      type: Number,
      default: null,
    },
    branchCode: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Admin = model<IAdmin>('Admin', adminSchema);

export default Admin;
