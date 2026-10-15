import httpStatus from 'http-status';
import sendResponse from '../../utilities/sendResponse';
import RescheduleRequestServices from './booking_reschedule.service';
import catchAsync from '../../utilities/catchasync';

const createRescheduleRequest = catchAsync(async (req, res) => {
  console.log("payload", req.body);

  const result = await RescheduleRequestServices.createRescheduleRequest(
    req.user,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reschedule request successfully created',
    data: result,
  });
});
const changeRescheduleRequestStatus = catchAsync(async (req, res) => {
  const result = await RescheduleRequestServices.changeRescheduleRequestStatus(
    req.user,
    req.params.id,
    req.body.status,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reschedule request status changed successfully',
    data: result,
  });
});


const RescheduleRequestController = {
  createRescheduleRequest,
  changeRescheduleRequestStatus
};

export default RescheduleRequestController;
