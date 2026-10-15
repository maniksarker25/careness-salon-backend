/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";

export interface IProduct {
  toObject: any;
  _id:string & Types.ObjectId;
  shop:Types.ObjectId;
  name: string;
  price: number;
  description: string;
  piecesSold: number;
  product_image: string;
}
