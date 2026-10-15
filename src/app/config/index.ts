import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  cors_origins: process.env.CORS_ORIGINS,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  base_url: process.env.BASE_URL,
  default_pass: process.env.DEFAULT_PASS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  reset_password_ui_link: process.env.RESET_PASSWORD_UI_LINK,
  logo_url: process.env.LOGO_URL || 'https://iili.io/nKxpds1.png',
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD,
  super_admin_email: process.env.SUPER_ADMIN_EMAIL,
  stripe: {
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,
    webhook_endpoint_secret: process.env.WEBHOOK_ENDPOINT_SECRET,
    connected_account_webhook_secret:
      process.env.CONNECTED_ACCOUNT_WEBHOOK_SECRET,
    onboarding_return_url: process.env.ONBOARDING_RETURN_URL,
    onboarding_refresh_url: process.env.ONBOARDING_REFRESH_URL,
    admin_fee_payment_success_url: process.env.ADMIN_FEE_PAYMENT_SUCCESS_URL,
    payment_cancel_url: process.env.PAYMENT_CANCEL_URL,
    booking_payment_success_url: process.env.BOOKING_PAYMENT_SUCCESS_URL,
  },
  // twilio for sms -------------
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  // resend for email -------------
  resend: {
    api_key: process.env.RESEND_API_KEY,
    from_email: process.env.RESEND_FROM_EMAIL,
    name: process.env.SERVICE_NAME,
  },
  onesignal: {
    appId: process.env.ONESIGNAL_APP_ID,
    apiKey: process.env.ONESIGNAL_API_KEY,
  },
};
