import { model, Schema } from 'mongoose';
import { IShopCategory } from './shopCategory.interface';

const ShopCategorySchema: Schema = new Schema(
  {
    categoryName: {
      type: String,
      required: true,
      unique: true,
    },
    // profitOnCategory: {
    //   type: Number,
    //   required: true,
    // },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    image: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const ShopCategory = model<IShopCategory>('ShopCategory', ShopCategorySchema);

export default ShopCategory;
