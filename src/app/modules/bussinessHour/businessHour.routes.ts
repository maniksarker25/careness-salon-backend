import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import BusinessHourController from './businessHour.controller';
import businessHourValidations from './businessHour.validation';

const router = express.Router();

router.get('/get-available-dates', BusinessHourController.getAvailableDates);
router.get('/get-available-slots', BusinessHourController.getAvailableSlots);
router.get(
  '/get-business-hour',
  auth(USER_ROLE.client, USER_ROLE.superAdmin, USER_ROLE.admin),
  BusinessHourController.getBusinessHour,
);
router.patch(
  '/update-business-hour/:id',
  auth(USER_ROLE.client),
  validateRequest(businessHourValidations.updateBusinessHourSchema),
  BusinessHourController.updateBusinessHour,
);
export const businessHourRoutes = router;
