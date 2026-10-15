import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import discountValidations from './discount.validation';
import DiscountController from './discount.controller';

const router = express.Router();

router.post(
  '/create-discount',
  auth(USER_ROLE.client),
  validateRequest(discountValidations.createDiscountSchema),
  DiscountController.createDiscount,
);
router.get(
  '/get-discount',
  auth(USER_ROLE.client),
  DiscountController.getDiscount,
);
router.patch(
  '/update-discount',
  auth(USER_ROLE.client),
  validateRequest(discountValidations.updateDiscountSchema),
  DiscountController.updateDiscount,
);
router.delete(
  '/delete-discount',
  auth(USER_ROLE.client),
  DiscountController.deleteDiscount,
);

export const discountRoutes = router;
