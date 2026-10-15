import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import feedbackController from './feedback.controller';
import feedbackValidations from './feedback.validation';

const router = express.Router();

router.post(
  '/create-feedback',
  auth(USER_ROLE.customer, USER_ROLE.client, USER_ROLE.admin),
  validateRequest(feedbackValidations.createFeedbackValidationSchema),
  feedbackController.createFeedBack,
);

router.get(
  '/all-feedbacks',
  auth(USER_ROLE.superAdmin),
  feedbackController.getAllFeedback,
);

router.put(
  '/reply-feedback/:id',
  auth(USER_ROLE.superAdmin),
  validateRequest(feedbackValidations.updateFeedbackValidationSchema),
  feedbackController.replyFeedback,
);

router.delete(
  '/delete-feedback/:id',
  auth(USER_ROLE.superAdmin),
  feedbackController.deleteFeedback,
);

export const feedbackRoutes = router;
