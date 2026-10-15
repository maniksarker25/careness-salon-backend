import { Types } from 'mongoose';

export interface IShopBanner {
  shop: Types.ObjectId;
  image: string;
}

export interface IAppBanner {
  image: string;
}
