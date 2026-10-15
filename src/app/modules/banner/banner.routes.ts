import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import bannerController from './banner.controller';
import { uploadFile } from '../../helper/fileUploader';

const router = express.Router();

router.post(
  '/create-shop-banner',
  uploadFile(),
  auth(USER_ROLE.superAdmin, USER_ROLE.admin),
  bannerController.createShopBanner,
);
router.get(
  '/my-shop-banners',
  auth(USER_ROLE.superAdmin, USER_ROLE.admin),
  bannerController.getMyShopBanner,
);
router.delete(
  '/delete-shop-banner/:id',
  auth(USER_ROLE.superAdmin, USER_ROLE.admin),
  bannerController.deleteMyShopBanner,
);
router.patch(
  '/update-shop-banner/:id',
  auth(USER_ROLE.superAdmin, USER_ROLE.admin),
  uploadFile(),
  bannerController.updateShopBanner,
);
// app banner
router.post(
  '/create-app-banner',
  uploadFile(),
  auth(USER_ROLE.superAdmin),
  bannerController.createAppBanner,
);
router.get(
  '/get-app-banners',
  auth(USER_ROLE.superAdmin),
  bannerController.getAppBanner,
);
router.delete(
  '/delete-app-banner/:id',
  auth(USER_ROLE.superAdmin),
  bannerController.deleteAppBanner,
);
router.patch(
  '/update-app-banner/:id',
  auth(USER_ROLE.superAdmin),
  uploadFile(),
  bannerController.updateAppBanner,
);
export const bannerRoutes = router;
