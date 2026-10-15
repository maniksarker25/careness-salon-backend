import { NextFunction, Request, Response, Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import { uploadFile } from '../../helper/fileUploader';
import AdminValidations from './admin.validation';
import AdminController from './admin.controller';

const router = Router();

router.patch(
  '/update-admin-profile',
  auth(USER_ROLE.admin),
  uploadFile(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }

    next();
  },
  validateRequest(AdminValidations.updateAdminProfileValidationSchema),
  AdminController.updateAdminProfile,
);

router.delete(
  '/delete-admin/:id',
  auth(USER_ROLE.superAdmin),
  AdminController.deleteAdmin,
);

router.patch(
  '/update-admin-status/:id',
  auth(USER_ROLE.superAdmin),
  AdminController.updateShopStatus,
);

router.get(
  '/all-admins',
  auth(USER_ROLE.superAdmin),
  AdminController.getAllAdmin,
);

router.patch(
  '/add-rating/:shopId',
  auth(USER_ROLE.customer),
  validateRequest(AdminValidations.addRatingValidationSchema),
  AdminController.addRating,
);

export const AdminRoutes = router;
