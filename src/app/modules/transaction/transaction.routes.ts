import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import TransactionController from './transaction.controller';

const router = express.Router();

router.get(
  '/get-all-transaction',
  auth(USER_ROLE.superAdmin, USER_ROLE.admin),
  TransactionController.getAllTransaction,
);
router.get(
  '/get-shop-transaction',
  auth(USER_ROLE.client),
  TransactionController.getClientTransaction,
);

export const transactionRoutes = router;
