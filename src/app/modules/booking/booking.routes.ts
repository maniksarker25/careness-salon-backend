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

export const bookingRoutes = router;
