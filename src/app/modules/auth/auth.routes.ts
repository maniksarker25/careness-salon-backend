import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';

import auth from '../../middlewares/auth';
import authControllers from './auth.controller';
import { USER_ROLE } from '../user/user.constant';
import authValidations from './auth.validation';
import {
  authLimiter,
  sensitiveActionLimiter,
} from '../../middlewares/rateLimiter';

const router = Router();

router.post(
  '/login',
  authLimiter,
  validateRequest(authValidations.loginValidationSchema),
  authControllers.loginUser,
);
router.post(
  '/change-password',
  auth(
    USER_ROLE.customer,
    USER_ROLE.client,
    USER_ROLE.admin,
    USER_ROLE.superAdmin,
  ),
  validateRequest(authValidations.changePasswordValidationSchema),
  authControllers.changePassword,
);
router.post(
  '/refresh-token',
  authLimiter,
  validateRequest(authValidations.refreshTokenValidationSchema),
  authControllers.refreshToken,
);

router.post(
  '/forget-password',
  sensitiveActionLimiter,
  validateRequest(authValidations.forgetPasswordValidationSchema),
  authControllers.forgetPassword,
);
router.post(
  '/reset-password',
  sensitiveActionLimiter,
  validateRequest(authValidations.resetPasswordValidationSchema),
  authControllers.resetPassword,
);
router.post(
  '/verify-reset-otp',
  sensitiveActionLimiter,
  validateRequest(authValidations.verifyResetOtpValidationSchema),
  authControllers.verifyResetOtp,
);

router.post(
  '/resend-reset-code',
  sensitiveActionLimiter,
  validateRequest(authValidations.resendResetCodeValidationSchema),
  authControllers.resendResetCode,
);

export const authRoutes = router;
