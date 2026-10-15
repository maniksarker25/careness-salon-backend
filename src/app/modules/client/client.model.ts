import { model, models, Schema } from 'mongoose';
import {
  ENUM_GENDER,
  ENUM_PAYMENT_PREFERENCES,
} from '../../utilities/enum';
import { ILocation } from '../customer/customer.interface';
import formatPhoneNumber from '../../utilities/formatPhoneNumber';
import { IClient } from './client.interface';

const locationSchema = new Schema<ILocation>({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

const clientSchema = new Schema<IClient>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    shopCategoryId: {
      type: Schema.Types.ObjectId,
      // required:true,
      ref: 'ShopCategory',
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, set: formatPhoneNumber },
    gender: {
      type: String,
      enum: Object.values(ENUM_GENDER),
    },
    dateOfBirth: {
      type: Date,
    },
    shopName: {
      type: String,
    },
    city: {
      type: String,
    },
    shopCategory: { type: String },
    shopGenderCategory: {
      type: String,
      enum: Object.values(ENUM_GENDER),
    },
    shopImages: {
      type: [String],
    },

    location: {
      type: locationSchema,
      // required: true,
      index: '2dsphere',
    },
    profile_image: { type: String, default: '' },
    bankName: { type: String },
    bankAccountName: { type: String },
    bankAccountNumber: { type: String },
    branchCode: { type: String },
    bankCity: { type: String },
    payOnShopChargeDueAmount: { type: Number, default: 0 },
    address: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
    totalRating: {
      type: Number,
      default: 0,
    },
    totalRatingCount: {
      type: Number,
      default: 0,
    },
    paymentPreferences: {
      type: String,
      enum: Object.values(ENUM_PAYMENT_PREFERENCES),
    },
    isShopInfoProvided: { type: Boolean, default: false },
    isProfileCompleted: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    stripAccountId: { type: String },
    isStripeConnected: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

const Client = models.Client || model('Client', clientSchema);

export default Client;
