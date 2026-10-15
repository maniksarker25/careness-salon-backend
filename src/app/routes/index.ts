import { Router } from 'express';
import { userRoutes } from '../modules/user/user.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { customerRoutes } from '../modules/customer/customer.routes';
import { productRoutes } from '../modules/product/product.routes';
import { categoryRoutes } from '../modules/category/category.routes';
import { bannerRoutes } from '../modules/banner/banner.routes';
import { ManageRoutes } from '../modules/manage-web/manage.routes';
import { feedbackRoutes } from '../modules/feedback/feedback.routes';
import { productBookmarkRoutes } from '../modules/productBookmark/product.bookmark.routes';
import { shopBookmarkRoutes } from '../modules/shopBookmak/product.bookmark.routes';
import { cartRoutes } from '../modules/cart/cart.routes';
import { metaRoutes } from '../modules/meta/meta.routes';
import { AdminRoutes } from '../modules/admin/admin.routes';
import { clientRoutes } from '../modules/client/client.routes';
import { shopCategoryRoutes } from '../modules/shopCategory/shopCategory.routes';
import { staffRoutes } from '../modules/staff/staff.routes';
import { serviceRoutes } from '../modules/service/service.routes';
import { businessHourRoutes } from '../modules/bussinessHour/businessHour.routes';
import { bookingRoutes } from '../modules/booking/booking.routes';
import { blockHourRoutes } from '../modules/blockHour/blockHour.routes';
import { discountRoutes } from '../modules/discount/discount.routes';
import { ratingRoutes } from '../modules/rating/rating.routes';
import { stripeRoutes } from '../modules/stripe/stripe.routes';
import { rescheduleRequestRoutes } from '../modules/booking_reschedule/booking_reschedule.routes';
import { transactionRoutes } from '../modules/transaction/transaction.routes';
import { superAdminRoutes } from '../modules/superAdmin/superAdmin.routes';
import { notificationRoutes } from '../modules/notification/notification.routes';
import { uploadRoutes } from '../modules/file-upload/fileUpload.routes';
import { conversationRoutes } from '../modules/conversation/conversation.routes';
import { messageRoutes } from '../modules/message/message.routes';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    router: authRoutes,
  },
  {
    path: '/user',
    router: userRoutes,
  },
  {
    path: '/customer',
    router: customerRoutes,
  },
  {
    path: '/admin',
    router: AdminRoutes,
  },
  {
    path: '/client',
    router: clientRoutes,
  },
  {
    path: '/staff',
    router: staffRoutes,
  },
  {
    path: '/product',
    router: productRoutes,
  },
  {
    path: '/category',
    router: categoryRoutes,
  },
  {
    path: '/banner',
    router: bannerRoutes,
  },
  {
    path: '/manage',
    router: ManageRoutes,
  },
  {
    path: '/feedback',
    router: feedbackRoutes,
  },
  {
    path: '/product-bookmark',
    router: productBookmarkRoutes,
  },
  {
    path: '/shop-bookmark',
    router: shopBookmarkRoutes,
  },
  {
    path: '/cart',
    router: cartRoutes,
  },
  {
    path: '/meta',
    router: metaRoutes,
  },
  {
    path: '/shop-category',
    router: shopCategoryRoutes,
  },
  {
    path: '/service',
    router: serviceRoutes,
  },
  {
    path: '/business-hour',
    router: businessHourRoutes,
  },
  {
    path: '/block-hour',
    router: blockHourRoutes,
  },
  {
    path: '/booking',
    router: bookingRoutes,
  },
  {
    path: '/discount',
    router: discountRoutes,
  },
  {
    path: '/rating',
    router: ratingRoutes,
  },
  {
    path: '/stripe',
    router: stripeRoutes,
  },
  {
    path: '/reschedule-request',
    router: rescheduleRequestRoutes,
  },
  {
    path: '/transaction',
    router: transactionRoutes,
  },
  {
    path: '/super-admin',
    router: superAdminRoutes,
  },
  {
    path: '/notification',
    router: notificationRoutes,
  },
  {
    path: '/file-upload',
    router: uploadRoutes,
  },
  {
    path: '/conversation',
    router: conversationRoutes,
  },
  {
    path: '/message',
    router: messageRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.router));

export default router;
