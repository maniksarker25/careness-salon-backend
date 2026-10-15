import { Document, Types } from 'mongoose';

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ICart extends Document {
  customer: Types.ObjectId;
  shop: Types.ObjectId;
  items: ICartItem[];
  totalQuantity: number;
  subTotal: number;
  deliveryFee: number;
  totalPrice: number;
}
