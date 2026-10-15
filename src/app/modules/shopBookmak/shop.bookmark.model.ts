import { model, Schema } from 'mongoose';
import { IShopBookmark } from './shop.bookmark.interface';

const shopBookmarkSchema = new Schema<IShopBookmark>(
  {
    shop: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: 'Client',
    },
    costumer: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Costumer',
    },
  },
  {
    timestamps: true,
  },
);

const ShopBookmark = model('ShopBookmark', shopBookmarkSchema);

export default ShopBookmark;
