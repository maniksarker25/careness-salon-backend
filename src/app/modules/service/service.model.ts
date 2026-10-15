import { model, Schema } from 'mongoose';
import IService from './service.interface';

const ServiceSchema: Schema<IService> = new Schema(
  {
    shop: { type: Schema.Types.ObjectId, required: true, ref: 'Client' },
    serviceName: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },
    shopCategory: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'ShopCategory',
    },
    availableFor: {
      type: String,
      enum: ['Everyone', 'Male', 'Female'],
      required: true,
    },
    durationMinutes: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  {
    timestamps: true,
  },
);

const Service = model<IService>('Service', ServiceSchema);

export default Service;
