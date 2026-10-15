import express from 'express';
import { USER_ROLE } from '../user/user.constant';
import auth from '../../middlewares/auth';
import productBookmarkController from './product.bookmark.controller';

const router = express.Router();

// router.post(
//   '/create-product-bookmark',
//   auth(USER_ROLE.customer),
//   productBookmarkController.createBookmark,
// );
router.post(
  '/add-delete-product-bookmark/:id',
  auth(USER_ROLE.customer),
  productBookmarkController.productBookmarkAddDelete,
);
router.get(
  '/my-bookmark-products',
  auth(USER_ROLE.customer),
  productBookmarkController.getMyBookmark,
);
router.delete(
  '/delete-bookmark-product/:id',
  auth(USER_ROLE.customer),
  productBookmarkController.deleteBookmark,
);

export const productBookmarkRoutes = router;
