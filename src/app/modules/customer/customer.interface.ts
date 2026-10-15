import { Types } from 'mongoose';
import { ENUM_GENDER } from '../../utilities/enum';

export interface ILocation {
  type: 'Point';
  coordinates: [number, number];
}
export interface ICustomer {
  user: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  country: string;
  gender: (typeof ENUM_GENDER)[keyof typeof ENUM_GENDER];
  age: string;
  // location: ILocation;
  address: string;
  profile_image: string;
  isProfileComplete: boolean;
  isDeleted: boolean;
  phoneNumber: string;
}

export interface ICompleteCustomer {
  phoneNumber?: string;
  gender?: (typeof ENUM_GENDER)[keyof typeof ENUM_GENDER];
  city?: string;
  country?: string;
}
