/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtPayload } from 'jsonwebtoken';
import QueryBuilder from '../../builder/QueryBuilder';
import sendPushNotification from '../../helper/sendPushNotification';
import { USER_ROLE } from '../user/user.constant';
import Notification from './notification.model';

import mongoose from 'mongoose';
import { Device } from '../device/device.model';
const getAllNotificationFromDB = async (
  query: Record<string, any>,
  user: JwtPayload,
) => {
  const receiver =
    user?.role === USER_ROLE.superAdmin || user?.role === USER_ROLE.admin
      ? USER_ROLE.admin
      : user?.profileId;

  const notificationQuery = new QueryBuilder(
    Notification.find({ receiver }),
    query,
  )
    .search(['title'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await notificationQuery.modelQuery;
  const meta = await notificationQuery.countTotal();

  const unreadCount = await Notification.countDocuments({
    receiver,
    isRead: false,
  });

  return {
    meta: {
      ...meta,
      unreadCount,
    },
    result,
  };
};

const seeNotification = async (user: JwtPayload) => {
  let result;

  console.log('User Info:', user); // Debug log
  if (user?.role === USER_ROLE.superAdmin || user?.role === USER_ROLE.admin) {
    result = await Notification.updateMany(
      { receiver: USER_ROLE.admin },
      { isRead: true },
      { runValidators: true },
    );
    // const adminUnseenNotificationCount = await getAdminNotificationCount();
    //@ts-ignore
    // global.io.emit('admin-notifications', adminUnseenNotificationCount);
  }
  if (user?.role !== USER_ROLE.superAdmin && user?.role !== USER_ROLE.admin) {
    result = await Notification.updateMany(
      { receiver: user?.profileId },
      { isRead: true },
      { runValidators: true },
    );
  }
  //   const updatedNotificationCount = await getUnseenNotificationCount(
  //     user?.userId,
  //   );
  //@ts-ignore
  //   global.io.to(user?.userId).emit('notifications', updatedNotificationCount);
  return result;
};
const seeSingleNotification = async (
  notificationId: string,
  user: JwtPayload,
) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new Error('Invalid Notification ID');
  }

  const filter: any = {
    _id: new mongoose.Types.ObjectId(notificationId),
  };

  // Security: ensure user can only update their own notification
  if (user?.role === USER_ROLE.superAdmin || user?.role === USER_ROLE.admin) {
    filter.receiver = USER_ROLE.admin;
  } else {
    filter.receiver = user?.profileId;
  }

  const result = await Notification.findOneAndUpdate(
    filter,
    { isRead: true },
    { new: true, runValidators: true },
  );

  return result;
};
const sendNotification = async ({
  receiver,
  title,
  message,
  type,
  entity,
  action = 'VIEW',
  entityId,
  meta = {},
  image,
  bookingId,
  rescheduleDateTime,
}: any) => {
  const notification = await Notification.create({
    receiver,
    title,
    message,
    type,
    image,
    bookingId: bookingId || meta?.bookingId,
    rescheduleDateTime,
    data: {
      entity,
      action,
      entityId,
      meta,
    },
  });

  console.log(`Notification created for ${receiver}: ${title} - ${message}`);

  const userId = receiver.toString();

  // const io = getIO();
  // const online = isUserOnline(userId);

  // 1. REALTIME (socket)
  // if (online) {
  //   console.log(`User ${userId} is online. Sending real-time notification.`);
  //   io.to(userId).emit('notification', notification);
  //   io.to(userId).emit('notifications', {
  //     unseenCount: await Notification.countDocuments({
  //       receiver: userId,
  //       isSeen: false,
  //     }),
  //     latestNotification: notification,
  //   });
  //   return notification;
  // }

  console.log(`User ${userId} is offline. Sending push notification.`);

  // 2. OFFLINE PUSH (NEW SYSTEM)
  const devices = await Device.find({
    userId: receiver,
    isActive: true,
  }).select('playerId');

  const playerIds = devices.map((d) => d.playerId).filter(Boolean);

  console.log(
    `Sending push notification to ${playerIds.length} devices for user ${userId}`,
  );

  if (playerIds.length > 0) {
    await sendPushNotification({
      playerIds,
      message,
      heading: title,
      data: {
        entity,
        action,
        entityId,
        ...meta,
      },
    });
  }

  return notification;
};

const deleteSingleNotification = async (
  notificationId: string,
  user: JwtPayload,
) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new Error('Invalid Notification ID');
  }

  const filter: any = {
    _id: new mongoose.Types.ObjectId(notificationId),
  };

  // ensure user can only delete their own notifications
  if (user?.role === USER_ROLE.superAdmin || user?.role === USER_ROLE.admin) {
    filter.receiver = USER_ROLE.admin;
  } else {
    filter.receiver = user?.profileId;
  }

  const result = await Notification.findOneAndDelete(filter);

  if (!result) {
    throw new Error('Notification not found or already deleted');
  }

  return result;
};

const NotificationService = {
  getAllNotificationFromDB,
  seeNotification,
  sendNotification,
  seeSingleNotification,
  deleteSingleNotification,
};

export default NotificationService;
