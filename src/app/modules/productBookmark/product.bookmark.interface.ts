import { Types } from 'mongoose';

export interface IBookmark {
  product: Types.ObjectId;
  costumer: Types.ObjectId;
}
