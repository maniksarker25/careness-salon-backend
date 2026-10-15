import { model, Schema } from 'mongoose';
import { IAppBanner, IShopBanner } from './banner.interface';

const shopBannerSchema = new Schema<IShopBanner>({
  shop: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Admin',
  },
  image: {
    type: String,
    required: true,
  },
});

const appBannerSchema = new Schema<IAppBanner>({
  image: {
    type: String,
    required: true,
  },
});

export const ShopBanner = model('ShopBanner', shopBannerSchema);
export const AppBanner = model('AppBanner', appBannerSchema);
