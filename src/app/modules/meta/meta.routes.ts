import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import metaController from './meta.controller';

const router = express.Router();
router.get(
  '/get-meta-data',
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  metaController.getDashboardMetaData,
);
router.get(
  '/sales-profit-chart-data',
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  metaController.getMonthlySalesAndProfitChartData,
);
export const metaRoutes = router;
