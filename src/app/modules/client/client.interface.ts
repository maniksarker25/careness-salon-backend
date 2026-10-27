import { Types } from 'mongoose';
import {
  ENUM_GENDER,
  ENUM_PAYMENT_PREFERENCES,
} from '../../utilities/enum';
export interface ILocation {
  type: 'Point';
  coordinates: [number, number];
}
// client interface
export interface IClient {
  user: Types.ObjectId;
  shopCategoryId: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: (typeof ENUM_GENDER)[keyof typeof ENUM_GENDER];
  dateOfBirth: Date;
  city: string;
  shopName: string;
  shopCategory: string;
  shopGenderCategory: (typeof ENUM_GENDER)[keyof typeof ENUM_GENDER];
  shopImages: string[];
  location: ILocation;
  address?: string | null;
  profile_image: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  branchCode: string;
  bankCity: string;
  paymentPreferences: (typeof ENUM_PAYMENT_PREFERENCES)[keyof typeof ENUM_PAYMENT_PREFERENCES];
  payOnShopChargeDueAmount: number;
  status: 'active' | 'inactive';
  totalRating: number;
  totalRatingCount: number;
  isDeleted: boolean;
  isShopInfoProvided: boolean;
  isProfileCompleted: boolean;
  stripAccountId: string;
  isStripeConnected: boolean;
}

export type TUpdateClientProfilePayload = Omit<
  Partial<IClient>,
  'shopImages'
> & {
  deleteImages?: string[];
  newShopImages?: string[];
};
