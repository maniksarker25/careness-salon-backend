import { model, Schema } from 'mongoose';
import { IBooking } from './booking.interface';
import {
  ENUM_BOOKING_STATUS,
  ENUM_PAYMENT_TYPE,
} from '../../utilities/enum';

const servicesSchema = new Schema({
  serviceId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Service',
  },
  price: {
    type: Number,
    required: true,
  },
});

const BookingSchema = new Schema<IBooking>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      // required: true,
      default: null,
    },
    shopId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    // serviceIds: [{ type: Schema.Types.ObjectId, ref: 'Service', required: true }],
    services: [servicesSchema],
    // products:[productsSchema],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(ENUM_BOOKING_STATUS),
      default: ENUM_BOOKING_STATUS.BOOKED,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    totalDuration: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      enum: Object.values(ENUM_PAYMENT_TYPE),
      required: true,
    },
    shopCategoryId: { type: Schema.Types.ObjectId, required: true },
    note: {
      type: String,
    },
    paymentIntentId: {
      type: String,
    },
    // set when staff marks the customer as a no-show; pay-on-shop no-shows
    // never collect payment, so they must not count as revenue
    isNoShow: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

const Booking = model('Booking', BookingSchema);

export default Booking;
