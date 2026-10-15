import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import BusinessHourServices from './businessHour.services';

const getAvailableDates = catchAsync(async (req, res) => {
  const result = await BusinessHourServices.getAvailableDates(
    req.query.staffId as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Available dates retrieved successfully',
    data: result,
  });
});
const getAvailableSlots = catchAsync(async (req, res) => {
  const result = await BusinessHourServices.getAvailableTimeSlots(
    req.query.staffId as string,
    req.query.date as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Available slots retrieved successfully',
    data: result,
  });
});
const getBusinessHour = catchAsync(async (req, res) => {
  const result = await BusinessHourServices.getBusinessHour(
    req.query.entityId as string,
    req.query.entityType as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Business hour retrieved successfully',
    data: result,
  });
});

const updateBusinessHour = catchAsync(async (req, res) => {
  const result = await BusinessHourServices.updateBusinessHour(
    req.user,
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Business hour updated successfully',
    data: result,
  });
});

const BusinessHourController = {
  getAvailableDates,
  getAvailableSlots,
  getBusinessHour,
  updateBusinessHour,
};

export default BusinessHourController;
