import { Types } from 'mongoose';

export interface IDiscount {
  shop: Types.ObjectId;
  discountPercentage: number;
  services: 'all-services' | Types.ObjectId[];
  // products:"all-products" | Types.ObjectId[];
  discountStartDate: Date;
  discountEndDate: Date;
}
