/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import { appEventEmitter } from '../../events/eventEmitter';
import AppError from '../../error/appError';
import { ENUM_NOTIFICATION_TYPE } from '../../utilities/enum';
import Booking from '../booking/booking.model';
import Client from '../client/client.model';
import Customer from '../customer/customer.model';
import Notification from '../notification/notification.model';
import { USER_ROLE } from '../user/user.constant';
import { ENUM_BOOKING_STATUS } from '../../utilities/enum';
import {
  formatSalonDate,
  formatSalonDisplayDate,
  formatSalonDisplayTime,
  toSalonDateTime,
} from '../../utilities/salonTime';
import { assertWithinBusinessHours } from '../bussinessHour/businessHour.utils';
import { IBookingReschedule } from './booking_reschedule.interface';

const createRescheduleRequest = async (
  userData: JwtPayload,
  payload: IBookingReschedule,
) => {
  const booking = await Booking.findById(payload.bookingId);
  if (!booking) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Booking not found');
  }
  const shop = await Client.findById(booking.shopId).select(
    'shopName shopImages user',
  );
  const customer = await Customer.findById(booking.customerId);
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  const startDate = toSalonDateTime(
    payload.rescheduleDate,
    payload.rescheduleTime,
  );

  const endDate = new Date(startDate);
  endDate.setMinutes(startDate.getMinutes() + booking.totalDuration);
  // Reject closed days and times outside the shop's / staff member's hours.
  await assertWithinBusinessHours({
    shopId: booking.shopId,
    staffId: booking.staffId,
    date: payload.rescheduleDate,
    startDate,
    endDate,
  });

  // Check for conflicting bookings (ignoring this booking itself and
  // bookings that no longer occupy the slot)
  const existingBookings = await Booking.find({
    _id: { $ne: booking._id },
    staffId: booking.staffId,
    status: {
      $in: [ENUM_BOOKING_STATUS.PENDING, ENUM_BOOKING_STATUS.BOOKED],
    },
    startTime: { $lt: endDate },
    endTime: { $gt: startDate },
  });
  //check operation
  if (existingBookings.length > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      'The selected time slot is conflict with other booking. Please choose a different time',
    );
  }

  const requestReceiver =
    userData.role === USER_ROLE.client ? booking.customerId : booking.shopId;

  // Always shown in salon (Germany) time, never the server's timezone.
  const formattedDate = formatSalonDisplayDate(startDate); // e.g., "12/02/24"
  const formattedTime = formatSalonDisplayTime(startDate); // e.g., "5:00 pm"

  // Creating the notification message
  const notificationMessage =
    userData.role === USER_ROLE.client
      ? `${shop.shopName} requesting to reschedule the booking on ${formattedDate} at ${formattedTime}.`
      : `${
          customer?.firstName + ' ' + customer?.lastName
        } requesting to reschedule the booking on ${formattedDate} at ${formattedTime}.`;
  const notificationImage = USER_ROLE.client
    ? `${shop?.shopImages[0]}`
    : `${customer?.profile_image}`;
  //   const rescheduleRequest = await RescheduleRequest.create({
  //     bookingId: booking._id,
  //     rescheduleDate: startDate,
  //     status: ENUM_RESCHEDULE_STATUS.PENDING,
  //   });
  const notificationData = {
    title: 'Reschedule Request',
    message: notificationMessage,
    image: notificationImage,
    receiver: requestReceiver,
    type: ENUM_NOTIFICATION_TYPE.RESCHEDULE_BOOKING,
    bookingId: booking._id,
    rescheduleDateTime: startDate,
    // rescheduleId: rescheduleRequest._id,
  };

  // Create notification for the receiver
  appEventEmitter.emit('booking.reschedule.requested', {
    ...notificationData,
    receiver: requestReceiver.toString(),
    bookingId: booking._id.toString(),
    rescheduleDateTime: startDate,
  });
};

const changeRescheduleRequestStatus = async (
  userData: JwtPayload,
  notificationId: string,
  status: string,
) => {
  let result;
  if (status === 'accept') {
    result = await acceptRescheduleRequest(userData, notificationId);
  } else {
    result = await rejectRescheduleRequest(userData, notificationId);
  }

  return result;
};

const acceptRescheduleRequest = async (
  userData: JwtPayload,
  notificationId: string,
) => {
  const notification: any = await Notification.findById(notificationId);
  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  const booking = await Booking.findById(notification.bookingId);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  const shop = await Client.findById(booking.shopId).select(
    'shopName shopImages user',
  );
  const customer = await Customer.findById(booking.customerId).select(
    'firstName lastName profile_image user',
  );

  const endDate = new Date(notification.rescheduleDateTime);
  endDate.setMinutes(
    notification.rescheduleDateTime.getMinutes() + booking.totalDuration,
  );

  // Hours or bookings may have changed since the request was made.
  await assertWithinBusinessHours({
    shopId: booking.shopId,
    staffId: booking.staffId,
    date: formatSalonDate(notification.rescheduleDateTime),
    startDate: notification.rescheduleDateTime,
    endDate,
  });

  await Booking.findByIdAndUpdate(booking._id, {
    startTime: notification.rescheduleDateTime,
    endTime: endDate,
  });
  await Notification.findByIdAndDelete(notificationId);
  const requestReceiver =
    userData.role === USER_ROLE.client ? booking.customerId : booking.shopId;
  const notificationMessage =
    userData.role === USER_ROLE.client
      ? `${shop.shopName} accept your reschedule request`
      : `${
          customer?.firstName + ' ' + customer?.lastName
        } accept your reschedule request`;
  const notificationImage = USER_ROLE.client
    ? `${shop?.shopImages[0]}`
    : `${customer?.profile_image}`;
  const notificationData = {
    title: 'Accept Reschedule Request',
    message: notificationMessage,
    image: notificationImage,
    receiver: requestReceiver,
    bookingId: booking._id,
    type: ENUM_NOTIFICATION_TYPE.GENERAL,
  };

  appEventEmitter.emit('booking.reschedule.accepted', {
    ...notificationData,
    receiver: requestReceiver.toString(),
    bookingId: booking._id.toString(),
  });
};

const rejectRescheduleRequest = async (
  userData: JwtPayload,
  notificationId: string,
) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  const booking = await Booking.findById(notification.bookingId);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  const shop = await Client.findById(booking.shopId).select(
    'shopName shopImages',
  );

  const customer = await Customer.findById(booking.customerId).select(
    'firstName lastName profile_image',
  );

  await Notification.findByIdAndDelete(notificationId);
  const requestReceiver =
    userData.role === USER_ROLE.client ? booking.customerId : booking.shopId;
  const notificationMessage =
    userData.role === USER_ROLE.client
      ? `${shop.shopName} reject your reschedule request`
      : `${
          customer?.firstName + ' ' + customer?.lastName
        } reject your reschedule request`;
  const notificationImage = USER_ROLE.client
    ? `${shop?.shopImages[0]}`
    : `${customer?.profile_image}`;
  const notificationData = {
    title: 'Reject Reschedule Request',
    message: notificationMessage,
    image: notificationImage,
    receiver: requestReceiver,
    bookingId: booking._id,
    type: ENUM_NOTIFICATION_TYPE.REJECT_REQUEST,
  };

  appEventEmitter.emit('booking.reschedule.rejected', {
    ...notificationData,
    receiver: requestReceiver.toString(),
    bookingId: booking._id.toString(),
  });
};

const RescheduleRequestServices = {
  createRescheduleRequest,
  changeRescheduleRequestStatus,
};

export default RescheduleRequestServices;
