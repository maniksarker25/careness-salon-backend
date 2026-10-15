import { Types } from 'mongoose';

export interface IShopBookmark {
  shop: Types.ObjectId;
  costumer: Types.ObjectId;
}
