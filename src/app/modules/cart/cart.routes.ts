import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import cartControllers from './cart.controller';
import validateRequest from '../../middlewares/validateRequest';
import cartValidations from './cart.validation';

const router = express.Router();

router.post(
  '/add-to-cart',
  auth(USER_ROLE.customer),
  validateRequest(cartValidations.addToCartValidationSchema),
  cartControllers.addToCart,
);
router.patch(
  '/remove-cart-item',
  auth(USER_ROLE.customer),
  validateRequest(cartValidations.removeCartItemValidationSchema),
  cartControllers.removeCartItem,
);
router.get('/view-cart', auth(USER_ROLE.customer), cartControllers.viewCart);

router.patch(
  '/increase-item-quantity',
  auth(USER_ROLE.customer),
  validateRequest(cartValidations.removeCartItemValidationSchema),
  cartControllers.increaseItemQuantity,
);
router.patch(
  '/decrease-item-quantity',
  auth(USER_ROLE.customer),
  validateRequest(cartValidations.removeCartItemValidationSchema),
  cartControllers.decreaseItemQuantity,
);
router.delete(
  '/delete-cart',
  auth(USER_ROLE.customer),
  cartControllers.clearCart,
);

export const cartRoutes = router;
