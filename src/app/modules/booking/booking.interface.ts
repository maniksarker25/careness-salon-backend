import { Types } from 'mongoose';
import {
  ENUM_BOOKING_STATUS,
  ENUM_PAYMENT_TYPE,
} from '../../utilities/enum';

interface IServices {
  serviceId: Types.ObjectId;
  price: number;
}
interface IProducts {
  productId: Types.ObjectId;
  price: number;
}

export interface IBooking {
  customerId: Types.ObjectId;
  shopId: Types.ObjectId;
  staffId: Types.ObjectId;
  // serviceIds: string[];
  services: IServices[];
  products: IProducts;
  startTime: Date;
  endTime: Date;
  status: (typeof ENUM_BOOKING_STATUS)[keyof typeof ENUM_BOOKING_STATUS];
  totalPrice: number;
  totalDuration: number;
  paymentType: (typeof ENUM_PAYMENT_TYPE)[keyof typeof ENUM_PAYMENT_TYPE];
  shopCategoryId: Types.ObjectId;
  paymentIntentId: string;
  isNoShow?: boolean;
  note: string;
}
