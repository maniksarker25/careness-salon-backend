import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import serviceValidation from './service.validation';
import ServiceController from './service.controller';

const router = express.Router();

router.post(
  '/create-service',
  auth(USER_ROLE.client),
  validateRequest(serviceValidation.createServiceValidationSchema),
  ServiceController.createService,
);
router.patch(
  '/update-service/:id',
  auth(USER_ROLE.client),
  validateRequest(serviceValidation.updateServiceValidationSchema),
  ServiceController.updateService,
);
router.delete(
  '/delete-service/:id',
  auth(USER_ROLE.client),
  ServiceController.deleteService,
);
router.get(
  '/get-all',
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  ServiceController.getAllService,
);
router.get(
  '/my-services',
  auth(USER_ROLE.client),
  ServiceController.getMyServices,
);
router.get(
  '/single-service/:id',
  auth(
    USER_ROLE.client,
    USER_ROLE.admin,
    USER_ROLE.superAdmin,
    USER_ROLE.customer,
  ),
  ServiceController.getSingleService,
);
export const serviceRoutes = router;
