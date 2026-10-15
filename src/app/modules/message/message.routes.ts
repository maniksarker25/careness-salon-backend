import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import MessageController from './message.controller';

const router = express.Router();

router.get(
  '/get-messages/:id',
  auth(USER_ROLE.client, USER_ROLE.customer),
  MessageController.getMessages,
);

router.get(
  '/get-messages-with/:otherProfileId',
  auth(USER_ROLE.client, USER_ROLE.customer),
  MessageController.getMessagesWithUser,
);

export const messageRoutes = router;
