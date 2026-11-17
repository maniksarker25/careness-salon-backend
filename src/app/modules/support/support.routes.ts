import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { rateLimiter } from '../../middlewares/rateLimiter';
import { SupportValidations } from './support.validation';
import { SupportController } from './support.controller';

const router = express.Router();

// Public: anyone can contact support, limited to stop spam/abuse.
const supportLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many messages sent. Please try again in a few minutes.',
});

router.post(
  '/contact',
  supportLimiter,
  validateRequest(SupportValidations.contactSupportValidationSchema),
  SupportController.contactSupport,
);

export const supportRoutes = router;
