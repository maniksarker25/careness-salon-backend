import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import shopCategoryValidations from './shopCategory.validation';
import ShopCategoryController from './shopCategory.controller';
import validateRequest from '../../middlewares/validateRequest';
import { uploadFile } from '../../helper/fileUploader';

const router = express.Router();

router.post(
  '/create',
  auth(USER_ROLE.superAdmin, USER_ROLE.admin),
  uploadFile(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(shopCategoryValidations.createShopCategoryValidationSchema),
  ShopCategoryController.createShopCategory,
);
router.patch(
  '/update/:id',
  // auth(USER_ROLE.superAdmin, USER_ROLE.admin),
  uploadFile(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(shopCategoryValidations.updateShopCategoryValidationSchema),
  ShopCategoryController.updateShopCategory,
);
router.delete(
  '/delete/:id',
  auth(USER_ROLE.superAdmin, USER_ROLE.admin),
  ShopCategoryController.deleteShopCategory,
);
router.get('/get-all', ShopCategoryController.getAllShopCategory);
export const shopCategoryRoutes = router;
