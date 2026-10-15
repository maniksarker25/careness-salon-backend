import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import BookingService from './booking.service';
import sendResponse from '../../utilities/sendResponse';
import { USER_ROLE } from '../user/user.constant';

const createBooking = catchAsync(async (req, res) => {

  console.log("payload", req.body);
  let customerId;
  if (req.user.role === USER_ROLE.customer) {
    customerId = req.user.profileId;
  }
  const result = await BookingService.createBooking(
    // req.body.customerId,
    customerId,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking created successfully',
    data: result,
  });
});

const getCustomerBookings = catchAsync(async (req, res) => {
  console.log("payload", req.body);
  
  const result = await BookingService.getCustomerBookings(
    req.user.profileId,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings retrieved successfully',
    data: result,
  });
});
const createCancelBookingRequest = catchAsync(async (req, res) => {
  const result = await BookingService.createCancelBookingRequest(
    req.user,
    req.body.bookingId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings cancel request sent successfully',
    data: result,
  });
});

const changeCancelBookingRequestStatus = catchAsync(async (req, res) => {
  const result = await BookingService.changeCancelBookingRequestStatus(
    req.user,
    req.params.id,
    req.body.status,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings cancel request status changed successfully',
    data: result,
  });
});
const getShopBookings = catchAsync(async (req, res) => {
  const result = await BookingService.getShopBookings(
    req.user.profileId,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop booking retrieved successfully',
    data: result,
  });
});

const getPayOnShopBookingHistory = catchAsync(async (req, res) => {
  const result = await BookingService.getPayOnShopBookingHistory(
    req.user.profileId,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Pay on shop booking history retrieved successfully',
    data: result,
  });
});

const getSalesAndServiceData = catchAsync(async (req, res) => {
  const result = await BookingService.getSalesAndServiceData(
    req.user.profileId,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sales and Service data retrieved successfully',
    data: result,
  });
});

const markNoShow = catchAsync(async (req, res) => {
  const result = await BookingService.markNoShow(
    req.user.profileId,
    req.params.id,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Successfully marked as no-show',
    data: result,
  });
});

const markAsComplete = catchAsync(async (req, res) => {
  const result = await BookingService.markAsComplete(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Successfully marked as complete',
    data: result,
  });
});
const getSingleBooking = catchAsync(async (req, res) => {
  const result = await BookingService.getSingleBooking(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking retrieved successfully',
    data: result,
  });
});

const BookingController = {
  createBooking,
  getCustomerBookings,
  createCancelBookingRequest,
  changeCancelBookingRequestStatus,
  getShopBookings,
  getPayOnShopBookingHistory,
  getSalesAndServiceData,
  markNoShow,
  markAsComplete,
  getSingleBooking,
};

export default BookingController;
