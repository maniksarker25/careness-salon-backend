// import { NextFunction, Request, Response, Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import customerValidations from '../customer/customer.validation';
import userControllers from './user.controller';
// import { uploadFile } from '../../helper/fileUploader';

import { Router } from 'express';
import auth from '../../middlewares/auth';
import authWithoutActive from '../../middlewares/authWithoutActive';
import AdminValidations from '../admin/admin.validation';
import ClientValidations from '../client/client.validation';
import { USER_ROLE } from './user.constant';
import userValidations from './user.validation';

const router = Router();

router.post(
  '/register-customer',
  validateRequest(customerValidations.registerCustomerValidationSchema),
  userControllers.registerCustomer,
);

router.post(
  '/register-client',
  validateRequest(ClientValidations.registerClientValidationSchema),
  userControllers.registerClient,
);
router.post(
  '/create-admin',
  validateRequest(AdminValidations.registerAdminValidationSchema),
  userControllers.registerAdmin,
);

router.post('/register-Admin');
router.get(
  '/get-my-profile',
  authWithoutActive(
    USER_ROLE.superAdmin,
    USER_ROLE.customer,
    USER_ROLE.client,
    USER_ROLE.admin,
  ),
  userControllers.getMyProfile,
);

router.post(
  '/verify-code',
  validateRequest(userValidations.verifyCodeValidationSchema),
  userControllers.verifyCode,
);

router.post(
  '/resend-verify-code',
  validateRequest(userValidations.resendVerifyCodeSchema),
  userControllers.resendVerifyCode,
);

router.patch(
  '/block-unblock/:id',
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  validateRequest(userValidations.blockUnblockUserValidationSchema),
  userControllers.blockUnblockUser,
);
router.patch(
  '/delete-account',
  auth(USER_ROLE.customer, USER_ROLE.client),
  validateRequest(userValidations.deleteAccountValidationSchema),
  userControllers.deleteAccount,
);

export const userRoutes = router;
