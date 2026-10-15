import { Types } from 'mongoose';
import { appEventEmitter } from '../events/eventEmitter';
import Customer from '../modules/customer/customer.model';

type NewBookingNotificationInput = {
  _id: Types.ObjectId | string;
  shopId: Types.ObjectId | string;
  // empty for bookings a shop creates itself (e.g. walk-in customers)
  customerId?: Types.ObjectId | string | null;
  startTime: Date;
  paymentType?: string;
  totalPrice?: number;
};

const emitNewBookingNotification = async (
  booking: NewBookingNotificationInput,
) => {
  // A booking created by the shop itself has no customer: there is nobody to
  // name and the shop does not need to be notified about its own booking.
  if (!booking.customerId) return;

  try {
    const customer = await Customer.findById(booking.customerId).select(
      'firstName lastName profile_image',
    );

    const customerName = [customer?.firstName, customer?.lastName]
      .filter(Boolean)
      .join(' ');

    appEventEmitter.emit('booking.created', {
      receiver: booking.shopId.toString(),
      title: 'New Booking',
      message: `${customerName || 'A customer'} created a new booking.`,
      image: customer?.profile_image || '',
      bookingId: booking._id.toString(),
      meta: {
        bookingId: booking._id.toString(),
        customerId: booking.customerId.toString(),
        shopId: booking.shopId.toString(),
        startTime: booking.startTime,
        paymentType: booking.paymentType,
        totalPrice: booking.totalPrice,
      },
    });
  } catch (error) {
    // the booking is already saved: a notification problem must not turn a
    // successful booking into an error response
    console.error('Failed to emit new booking notification:', error);
  }
};

export default emitNewBookingNotification;
