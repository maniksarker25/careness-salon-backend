import { model, Schema } from "mongoose";
import { IProduct } from "./product.interface";

const ProductSchema: Schema = new Schema<IProduct>({
  shop:{
    type:Schema.Types.ObjectId,
    required:true,
    ref:"Client"
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
  },
  piecesSold: {
    type: Number,
    default: 0,
    min: 0,
  },
  product_image: {
    type: String,
    default:""
  },
});

// Export the model
export const Product = model<IProduct>('Product', ProductSchema);