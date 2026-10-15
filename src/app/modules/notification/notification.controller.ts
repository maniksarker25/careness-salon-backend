import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import notificationService from './notification.services';

const getAllNotification = catchAsync(async (req, res) => {
  const result = await notificationService.getAllNotificationFromDB(
    req?.query,
    req?.user,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notification retrieved successfully',
    data: result,
  });
});

const seeNotification = catchAsync(async (req, res) => {
  const result = await notificationService.seeNotification(req?.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notification seen successfully',
    data: result,
  });
});
const seeSingleNotification = catchAsync(async (req, res) => {
  const result = await notificationService.seeSingleNotification(
    req.params.id,
    req?.user,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notification seen successfully',
    data: result,
  });
});
const deleteNotification = catchAsync(async (req, res) => {
  const result = await notificationService.deleteSingleNotification(
    req.params.id,
    req?.user,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notification deleted successfully',
    data: result,
  });
});

const notificationController = {
  getAllNotification,
  seeSingleNotification,
  seeNotification,
  deleteNotification,
};

export default notificationController;
