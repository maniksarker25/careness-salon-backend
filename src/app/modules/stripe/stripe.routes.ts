import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import stripeController from './stripe.controller';

const router = express.Router();

router.post(
  '/connect-stripe',
  auth(USER_ROLE.client),
  stripeController.createOnboardingLink,
);

router.post(
  '/update-connected-account',
  auth(USER_ROLE.client),
  stripeController.updateOnboardingLink,
);

export const stripeRoutes = router;
