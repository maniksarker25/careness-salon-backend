import { model, Schema } from 'mongoose';
import { IBookmark } from './product.bookmark.interface';

const ProductBookmarkSchema = new Schema<IBookmark>(
  {
    product: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: 'Product',
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

const ProductBookmark = model('ProductBookmark', ProductBookmarkSchema);

export default ProductBookmark;
