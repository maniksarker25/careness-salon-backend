import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import SuperAdminController from './superAdmin.controller';
import { uploadFile } from '../../helper/fileUploader';

const router = express.Router();

router.patch(
  '/update-profile',
  auth(USER_ROLE.superAdmin),
  uploadFile(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  SuperAdminController.updateUserProfile,
);

export const superAdminRoutes = router;
