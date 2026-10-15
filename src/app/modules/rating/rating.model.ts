import { model, Schema } from 'mongoose';
import { IRating } from './rating.interface';

const RatingSchema = new Schema({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
  },
  shop:{
    type:Schema.Types.ObjectId,
    ref:"Client"
  },
  shopRating: { type: Number, required: true },
  shopRatingDescription: { type: String },
  staffRating: { type: Number, required: true },
});

export const Rating = model<IRating>('Rating', RatingSchema);
