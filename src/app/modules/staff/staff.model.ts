/* eslint-disable @typescript-eslint/no-explicit-any */
import { model, Schema, Types } from 'mongoose';
import formatPhoneNumber from '../../utilities/formatPhoneNumber';
import { IStaff } from './staff.interface';

const staffSchema = new Schema<IStaff>(
  {
    shop: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Client',
    },
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    phoneNumber: { type: String, required: true, set: formatPhoneNumber },
    email: { type: String, required: true, unique: true },
    employmentStartDate: { type: Date, required: true },
    services: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (value: any) {
          return (
            (typeof value === 'string' && value === 'all-services') ||
            (Array.isArray(value) &&
              value.every((id) => Types.ObjectId.isValid(id)))
          );
        },
        message:
          'Services should either be "all-services" or an array of valid service IDs',
      },
    },
    profile_image: { type: String, default: '' },
    totalRating: { type: Number, default: 0 },
    totalRatingCount: { type: Number, default: 0 },
    appointmentColor: { type: String, required: true },
  },
  { timestamps: true },
);
//
const Staff = model('Staff', staffSchema);

export default Staff;
