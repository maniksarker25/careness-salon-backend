import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import productValidations from './product.validation';
import productController from './product.controller';
import { uploadFile } from '../../helper/fileUploader';

const router = express.Router();

router.post(
  '/create-product',
  auth(USER_ROLE.client),
  uploadFile(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(productValidations.createProductSchema),
  productController.createProduct,
);

router.get(
  '/all-products',
  auth(
    USER_ROLE.superAdmin,
    USER_ROLE.admin,
  ),
  productController.getAllProduct,
);
router.get(
  '/my-products',
  auth(USER_ROLE.client),
  productController.getMyProducts,
);
router.get(
  '/single-product/:id',
  auth(
    USER_ROLE.customer,
    USER_ROLE.client,
    USER_ROLE.superAdmin,
    USER_ROLE.admin,
  ),
  productController.getSingleProduct,
);
router.patch(
  '/update-product/:id',
  auth(USER_ROLE.client),
  uploadFile(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(productValidations.updateProductSchema),
  productController.updateProduct,
);
router.delete(
  '/delete-product/:id',
  auth(USER_ROLE.client),
  productController.deleteProduct,
);
router.patch(
  '/change-product-status/:id',
  auth(USER_ROLE.admin),
  productController.changeProductStatus,
);
router.get(
  '/get-shop-products/:id',
  auth(USER_ROLE.client),
  productController.getShopProducts,
);
export const productRoutes = router;
