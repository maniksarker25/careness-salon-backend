import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import BookingController from './booking.controller';
import { changeCancelRequestStatusValidationsSchema } from './booking.validation';

const router = express.Router();

router.post(
  '/create-booking',
  auth(USER_ROLE.customer, USER_ROLE.client),
  BookingController.createBooking,
);
router.get(
  '/get-customer-bookings',
  auth(USER_ROLE.customer),
  BookingController.getCustomerBookings,
);
router.patch(
  '/change-cancel-booking-request-status/:id',
  auth(USER_ROLE.client, USER_ROLE.customer),
  validateRequest(changeCancelRequestStatusValidationsSchema),
  BookingController.changeCancelBookingRequestStatus,
);
router.post(
  '/create-cancel-booking-request',
  auth(USER_ROLE.customer, USER_ROLE.client),
  BookingController.createCancelBookingRequest,
);
router.get(
  '/get-shop-bookings',
  auth(USER_ROLE.client),
  BookingController.getShopBookings,
);
router.get(
  '/pay-on-shop-bookings',
  auth(USER_ROLE.client),
  BookingController.getPayOnShopBookingHistory,
);
router.get(
  '/get-sales-services-data',
  auth(USER_ROLE.client),
  BookingController.getSalesAndServiceData,
);
router.patch(
  '/mark-no-show/:id',
  auth(USER_ROLE.client),
  BookingController.markNoShow,
);
router.patch(
  '/mark-as-complete/:id',
  auth(USER_ROLE.client, USER_ROLE.customer),
  BookingController.markAsComplete,
);
router.get(
  '/get-single-booking/:id',
  auth(USER_ROLE.customer, USER_ROLE.client),
  BookingController.getSingleBooking,
);
router.get(
  '/admin/transfer-failures',
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  BookingController.getBookingTransferFailures,
);
router.post(
  '/admin/transfers/:transferId/retry',
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  BookingController.retryBookingTransfer,
);
router.post(
  '/admin/transfers/:transferId/reconcile',
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  BookingController.reconcileBookingTransferStatus,
);
router.get(
  '/admin/financial-operations',
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  BookingController.getFinancialOperationsForAdmin,
);
router.post(
  '/admin/financial-operations/:operationId/retry',
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  BookingController.retryFinancialOperationForAdmin,
);
router.post(
  '/admin/financial-operations/:operationId/reconcile',
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  BookingController.reconcileFinancialOperationForAdmin,
);

export const bookingRoutes = router;
