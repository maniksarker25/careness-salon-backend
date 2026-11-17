import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import { rateLimiter } from '../../middlewares/rateLimiter';
import { SupportValidations } from './support.validation';
import { SupportController } from './support.controller';

const router = express.Router();

// Public: anyone can contact support, limited to stop spam/abuse.
const supportLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many messages sent. Please try again in a few minutes.',
});

router.post(
  '/contact',
  supportLimiter,
  validateRequest(SupportValidations.contactSupportValidationSchema),
  SupportController.contactSupport,
);

// Admin: manage support requests in the dashboard.
const adminOnly = auth(USER_ROLE.admin, USER_ROLE.superAdmin);

router.get('/tickets', adminOnly, SupportController.getTickets);
router.get('/tickets/:id', adminOnly, SupportController.getTicket);
router.patch(
  '/tickets/:id',
  adminOnly,
  validateRequest(SupportValidations.updateTicketValidationSchema),
  SupportController.updateTicket,
);
router.delete('/tickets/:id', adminOnly, SupportController.deleteTicket);

export const supportRoutes = router;
