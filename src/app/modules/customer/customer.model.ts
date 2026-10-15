import { model, Schema } from 'mongoose';
import { ENUM_GENDER } from '../../utilities/enum';
import formatPhoneNumber from '../../utilities/formatPhoneNumber';
import { ICustomer } from './customer.interface';

const CustomerSchema = new Schema<ICustomer>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      // unique: true,
    },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    gender: {
      type: String,
      enum: Object.values(ENUM_GENDER),
    },
    age: {
      type: String,
    },
    phoneNumber: {
      type: String,
      set: formatPhoneNumber,
    },
    address: {
      type: String,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    profile_image: {
      type: String,
      default: '',
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

const Customer = model<ICustomer>('Customer', CustomerSchema);

export default Customer;
