/* eslint-disable @typescript-eslint/no-explicit-any */
import { model, Schema, Types } from 'mongoose';
import { IDiscount } from './discount.interface';

// const DiscountSchema: Schema = new Schema<IDiscount>(
//   {
//     shop: {
//       type: Schema.Types.ObjectId,
//       required: true,
//       ref: 'Client',
//     },
//     discountPercentage: {
//       type: Number,
//       required: true,
//       min: 0,
//       max: 100,
//     },
//     services: {
//       type: Schema.Types.Mixed,
//       required: true,
//       validator: function (value: any) {
//         return (
//           (typeof value === 'string' && value === 'all-services') ||
//           (Array.isArray(value) &&
//             value.every((id) => Types.ObjectId.isValid(id)))
//         );
//       },
//     },
//     products: {
//       type: Schema.Types.Mixed,
//       required: true,
//       validator: function (value: any) {
//         return (
//           (typeof value === 'string' && value === 'all-services') ||
//           (Array.isArray(value) &&
//             value.every((id) => Types.ObjectId.isValid(id)))
//         );
//       },
//     },
//     discountStartDate: {
//       type: Date,
//       required: true,
//     },
//     discountEndDate: {
//       type: Date,
//       required: true,
//       validate: {
//         validator: function (this: IDiscount, value: Date) {
//           return value > this.discountStartDate;
//         },
//         message: 'End date must be after start date',
//       },
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

const DiscountSchema: Schema = new Schema<IDiscount>(
  {
    shop: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Client',
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 50,
    },
    services: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (value: any) {
          return (
            value === 'all-services' ||
            (Array.isArray(value) &&
              value.every((id) => Types.ObjectId.isValid(id)))
          );
        },
        message: 'Services must be "all-services" or an array of ObjectIds.',
      },
      ref: 'Service', // Reference to the Service model for population
    },
    // products: {
    //   type: Schema.Types.Mixed,
    //   required: true,
    //   validate: {
    //     validator: function (value: any) {
    //       return (
    //         value === 'all-products' ||
    //         (Array.isArray(value) &&
    //           value.every((id) => Types.ObjectId.isValid(id)))
    //       );
    //     },
    //     message: 'Products must be "all-products" or an array of ObjectIds.',
    //   },
    //   ref: 'Product', // Reference to the Product model for population
    // },
    discountStartDate: {
      type: Date,
      required: true,
    },
    discountEndDate: {
      type: Date,
      required: true,
      validator: function (this: IDiscount, value: Date) {
        // Normalize both start and end dates to compare only the date portion
        const startDate = new Date(this.discountStartDate);
        const endDate = new Date(value);

        startDate.setHours(0, 0, 0, 0); // Set to midnight (ignores time)
        endDate.setHours(0, 0, 0, 0); // Set to midnight (ignores time)

        // Check if endDate is greater than startDate
        return endDate > startDate;
      },
    },
  },
  {
    timestamps: true,
  },
);

const Discount = model<IDiscount>('Discount', DiscountSchema);

export default Discount;
