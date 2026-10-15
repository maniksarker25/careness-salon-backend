import { appEventEmitter } from '../../events/eventEmitter';
import { errorLogger } from '../../shared/logger';
import {
  ENUM_NOTIFICATION_TYPE,
  NOTIFICATION_ACTION,
  NOTIFICATION_ENTITY,
} from './notification.enum';
import NotificationService from './notification.services';

type NotificationPayload = {
  receiver: string;
  title: string;
  message: string;
  image?: string;
  bookingId?: string;
  rescheduleDateTime?: Date;
  meta?: Record<string, unknown>;
};

const sendFromEvent = async (
  type: string,
  entity: string,
  payload: NotificationPayload,
) => {
  console.log(`Sending ${type} notification to ${payload.receiver}`);
  try {
    await NotificationService.sendNotification({
      receiver: payload.receiver,
      title: payload.title,
      message: payload.message,
      image: payload.image,
      type,
      entity,
      action: NOTIFICATION_ACTION.VIEW,
      entityId: payload.bookingId,
      bookingId: payload.bookingId,
      rescheduleDateTime: payload.rescheduleDateTime,
      meta: payload.meta || {},
    });
  } catch (err) {
    errorLogger.error(`${type} notification failed`, err);
  }
};

appEventEmitter.on('booking.created', (payload: NotificationPayload) =>
  sendFromEvent(
    ENUM_NOTIFICATION_TYPE.BOOKING_CREATED,
    NOTIFICATION_ENTITY.BOOKING,
    payload,
  ),
);

appEventEmitter.on('booking.cancel.requested', (payload: NotificationPayload) =>
  sendFromEvent(
    ENUM_NOTIFICATION_TYPE.BOOKING_CANCEL_REQUESTED,
    NOTIFICATION_ENTITY.BOOKING,
    payload,
  ),
);

appEventEmitter.on('booking.cancel.accepted', (payload: NotificationPayload) =>
  sendFromEvent(
    ENUM_NOTIFICATION_TYPE.BOOKING_CANCEL_ACCEPTED,
    NOTIFICATION_ENTITY.BOOKING,
    payload,
  ),
);

appEventEmitter.on('booking.cancel.rejected', (payload: NotificationPayload) =>
  sendFromEvent(
    ENUM_NOTIFICATION_TYPE.BOOKING_CANCEL_REJECTED,
    NOTIFICATION_ENTITY.BOOKING,
    payload,
  ),
);

appEventEmitter.on(
  'booking.reschedule.requested',
  (payload: NotificationPayload) =>
    sendFromEvent(
      ENUM_NOTIFICATION_TYPE.BOOKING_RESCHEDULE_REQUESTED,
      NOTIFICATION_ENTITY.BOOKING,
      payload,
    ),
);

appEventEmitter.on(
  'booking.reschedule.accepted',
  (payload: NotificationPayload) =>
    sendFromEvent(
      ENUM_NOTIFICATION_TYPE.BOOKING_RESCHEDULE_ACCEPTED,
      NOTIFICATION_ENTITY.BOOKING,
      payload,
    ),
);

appEventEmitter.on(
  'booking.reschedule.rejected',
  (payload: NotificationPayload) =>
    sendFromEvent(
      ENUM_NOTIFICATION_TYPE.BOOKING_RESCHEDULE_REJECTED,
      NOTIFICATION_ENTITY.BOOKING,
      payload,
    ),
);

appEventEmitter.on('shop.registered', (payload: NotificationPayload) =>
  sendFromEvent(
    ENUM_NOTIFICATION_TYPE.SHOP_REGISTERED,
    NOTIFICATION_ENTITY.SHOP,
    payload,
  ),
);

appEventEmitter.on('shop.status.changed', (payload: NotificationPayload) =>
  sendFromEvent(
    ENUM_NOTIFICATION_TYPE.SHOP_STATUS_CHANGED,
    NOTIFICATION_ENTITY.SHOP,
    payload,
  ),
);

appEventEmitter.on('admin-fee.alert', (payload: NotificationPayload) =>
  sendFromEvent(
    ENUM_NOTIFICATION_TYPE.ADMIN_FEE_ALERT,
    NOTIFICATION_ENTITY.ADMIN_FEE,
    payload,
  ),
);

appEventEmitter.on('profile.fetched', (payload: NotificationPayload) =>
  sendFromEvent(
    ENUM_NOTIFICATION_TYPE.PROFILE_FETCHED,
    NOTIFICATION_ENTITY.USER,
    payload,
  ),
);
