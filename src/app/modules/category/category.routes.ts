import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import categoryValidation, {
  createSubCategoryValidationSchema,
} from './category.validation';
import categoryController from './category.controller';
import { uploadFile } from '../../helper/fileUploader';

const router = express.Router();

router.post(
  '/create-category',
  auth(USER_ROLE.client),
  uploadFile(),
  validateRequest(categoryValidation.createCategoryValidationSchema),
  categoryController.createCategory,
);
router.patch(
  '/update-category/:id',
  auth(USER_ROLE.client),
  uploadFile(),
  validateRequest(categoryValidation.updateCategoryValidationSchema),
  categoryController.updateCategory,
);

router.get(
  '/my-categories',
  auth(USER_ROLE.client),
  categoryController.getMyCategories,
);

router.get('/all-categories', categoryController.getAllCategories);
router.get(
  '/shop-categories/:shopId',
  categoryController.getSpecificShopCategories,
);

router.delete(
  '/delete-category/:id',
  auth(USER_ROLE.client),
  categoryController.deleteCategory,
);
// sub category -------------------------------------
router.post(
  '/create-sub-category',
  auth(USER_ROLE.client),
  uploadFile(),
  validateRequest(createSubCategoryValidationSchema),
  categoryController.createSubCategory,
);
router.patch(
  '/update-sub-category/:id',
  auth(USER_ROLE.client),
  uploadFile(),
  validateRequest(categoryValidation.updateCategoryValidationSchema),
  categoryController.updateSubCategory,
);

router.get(
  '/my-sub-categories',
  auth(USER_ROLE.client),
  categoryController.getMySubCategories,
);

router.delete(
  '/delete-sub-category/:id',
  auth(USER_ROLE.client),
  categoryController.deleteSubCategory,
);

export const categoryRoutes = router;
