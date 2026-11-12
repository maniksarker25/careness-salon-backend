import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import BookingService from './booking.service';
import sendResponse from '../../utilities/sendResponse';
import { USER_ROLE } from '../user/user.constant';
import {
  getBookingTransfersNeedingAttention,
  reconcileBookingTransfer,
  retryFailedBookingTransfer,
} from './bookingTransfer.service';
import {
  getFinancialOperationsNeedingAttention,
  reconcileFinancialOperation,
  retryFinancialOperation,
} from './bookingFinancialOperation.service';

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
  const result = await BookingService.markAsComplete(req.user, req.params.id);
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

const getBookingTransferFailures = catchAsync(async (_req, res) => {
  const result = await getBookingTransfersNeedingAttention();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking transfers requiring attention retrieved successfully',
    data: result,
  });
});

const retryBookingTransfer = catchAsync(async (req, res) => {
  const result = await retryFailedBookingTransfer(req.params.transferId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking transfer retry scheduled',
    data: result,
  });
});

const reconcileBookingTransferStatus = catchAsync(async (req, res) => {
  const result = await reconcileBookingTransfer(
    req.params.transferId,
    req.body?.noMatchingTransfer === true,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.reconciled
      ? 'Booking transfer reconciled successfully'
      : 'No matching Stripe transfer was found; manual review is still required',
    data: result,
  });
});

const getFinancialOperationsForAdmin = catchAsync(async (_req, res) => {
  const result = await getFinancialOperationsNeedingAttention();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Financial operations requiring attention retrieved successfully',
    data: result,
  });
});

const retryFinancialOperationForAdmin = catchAsync(async (req, res) => {
  const result = await retryFinancialOperation(req.params.operationId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Financial operation retry scheduled',
    data: result,
  });
});

const reconcileFinancialOperationForAdmin = catchAsync(async (req, res) => {
  const result = await reconcileFinancialOperation(req.params.operationId, {
    noMatchingRefund: req.body?.noMatchingRefund === true,
    noMatchingTransfer: req.body?.noMatchingTransfer === true,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Financial operation reconciliation completed',
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
  getBookingTransferFailures,
  retryBookingTransfer,
  reconcileBookingTransferStatus,
  getFinancialOperationsForAdmin,
  retryFinancialOperationForAdmin,
  reconcileFinancialOperationForAdmin,
};

export default BookingController;
