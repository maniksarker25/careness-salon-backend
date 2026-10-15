import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLE } from '../user/user.constant';
import { uploadFile } from '../../helper/fileUploader';
import auth from '../../middlewares/auth';
import FileUploadController from './fileUpload.controller';
import AppError from '../../error/appError';
import httpStatus from 'http-status';

const router = express.Router();
// make chagnes
router.post(
  '/upload-images',
  auth(
    USER_ROLE.superAdmin,
    USER_ROLE.admin,
    USER_ROLE.customer,
    USER_ROLE.client,
  ),
  uploadFile(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      try {
        req.body = JSON.parse(req.body.data);
      } catch (error) {
        return next(new AppError(httpStatus.BAD_REQUEST, 'Invalid JSON data'));
      }
    }
    next();
  },
  FileUploadController.uploadImages,
);

export const uploadRoutes = router;
