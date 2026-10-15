import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import notificationController from './notification.controller';
const router = express.Router();

router.get(
  '/get-all-notification',
  auth(
    USER_ROLE.superAdmin,
    USER_ROLE.admin,
    USER_ROLE.client,
    USER_ROLE.customer,
  ),
  notificationController.getAllNotification,
);
router.patch(
  '/see-notifications',
  auth(
    USER_ROLE.customer,
    USER_ROLE.superAdmin,
    USER_ROLE.admin,
    USER_ROLE.client,
  ),
  notificationController.seeNotification,
);
router.patch(
  '/see-single/:id',
  auth(
    USER_ROLE.customer,
    USER_ROLE.client,
    USER_ROLE.admin,
    USER_ROLE.superAdmin,
  ),
  notificationController.seeSingleNotification,
);
router.delete(
  '/delete/:id',
  auth(
    USER_ROLE.customer,
    USER_ROLE.client,
    USER_ROLE.admin,
    USER_ROLE.superAdmin,
  ),
  notificationController.deleteNotification,
);
export const notificationRoutes = router;
