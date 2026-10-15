import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import ratingValidations from './rating.validation';
import validateRequest from '../../middlewares/validateRequest';
import RatingController from './rating.controller';

const router = express.Router();

router.post(
  '/create',
  auth(USER_ROLE.customer),
  validateRequest(ratingValidations.ratingValidationSchema),
  RatingController.createRating,
);

router.get('/shop-rating', auth(USER_ROLE.client), RatingController.getRatings);

export const ratingRoutes = router;
