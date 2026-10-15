// import Notification from '../modules/notification/notification.model';

// const getAdminNotificationCount = async () => {
//   const unseenCount = await Notification.countDocuments({
//     seen: false,
//     receiver: 'admin',
//   });
//   return unseenCount;
// };

// export default getAdminNotificationCount;

import Notification from '../modules/notification/notification.model';

const getAdminNotificationCount = async () => {
  const unseenCount = await Notification.countDocuments({
    seen: false,
    receiver: 'admin',
  });

  const latestNotification = await Notification.findOne({ receiver: 'admin' })
    .sort({ createdAt: -1 }) // Get the latest notification
    .lean(); // Improve performance by returning a plain object

  return {
    unseenCount,
    latestNotification,
  };
};

export default getAdminNotificationCount;
