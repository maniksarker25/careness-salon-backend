import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import RescheduleRequestController from './booking_reschedule.controller';
import validateRequest from '../../middlewares/validateRequest';
import BookingRescheduleValidations from './booking_reschedule.validation';

const router = express.Router();

router.post(
  '/create',
  auth(USER_ROLE.client, USER_ROLE.customer),
  validateRequest(BookingRescheduleValidations.bookingRescheduleSchema),
  RescheduleRequestController.createRescheduleRequest,
);
router.patch(
  '/change-reschedule-request-status/:id',
  auth(USER_ROLE.client, USER_ROLE.customer),
  validateRequest(
    BookingRescheduleValidations.changeRescheduleRequestStatusSchema,
  ),
  RescheduleRequestController.changeRescheduleRequestStatus,
);

export const rescheduleRequestRoutes = router;
