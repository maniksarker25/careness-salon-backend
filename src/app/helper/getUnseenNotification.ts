// import Notification from '../modules/notification/notification.model';

// const getUserNotificationCount = async (receiver: string) => {
//   const unseenCount = await Notification.countDocuments({
//     seen: false,
//     receiver: receiver,
//   });
//   const notification = await Notification.find({ receiver: receiver });
//   return unseenCount;
// };

// export default getUserNotificationCount;

import Notification from '../modules/notification/notification.model';

const getUserNotificationCount = async (receiver: string) => {
  const unseenCount = await Notification.countDocuments({
    isSeen: false,
    receiver: receiver,
  });

  const latestNotification = await Notification.findOne({ receiver: receiver })
    .sort({ createdAt: -1 }) // Sort by newest first
    .lean(); // Improve performance by returning a plain object

  return {
    unseenCount,
    latestNotification,
  };
};

export default getUserNotificationCount;
