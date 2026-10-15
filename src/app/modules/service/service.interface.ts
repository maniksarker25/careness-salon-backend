/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, Types } from 'mongoose';

interface IService {
  _id: Types.ObjectId;
  toObject: any;
  shop: Schema.Types.ObjectId;
  serviceName: string;
  category: Schema.Types.ObjectId;
  shopCategory: Schema.Types.ObjectId;
  availableFor: 'Everyone' | 'Male' | 'Female';
  durationMinutes: number;
  price: number;
}

export default IService;
