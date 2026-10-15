export const ENUM_PRODUCT_STATUS = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
} as const;

export const ENUM_SHOP_TYPE = {
  RESTAURANT: 'Restaurant',
  GROCERY: 'Grocery',
};
export const ENUM_SHOP_STATUS = {
  ACTIVATE: 'activate',
  DEACTIVATE: 'deactivate',
};

export const ENUM_ORDER_STATUS = {
  PENDING: 'pending',
  CANCELED: 'canceled',
  ACCEPTED: 'accepted',
  PICKED: 'picked',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
};

export const ENUM_GENDER = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHERS: 'Others',
} as const;

export type TGender = (typeof ENUM_GENDER)[keyof typeof ENUM_GENDER];

export const ENUM_PAYMENT_PREFERENCES = {
  ONLINE_ONLY: 'online-only',
  CASH_ONLY: 'cash-only',
  BOTH: 'both',
};

export const ENUM_NOTIFICATION_TYPE = {
  BOOKING: 'booking',
  CANCEL_BOOKING: 'cancel-booking',
  RESCHEDULE_BOOKING: 'reschedule-booking',
  START_BOOKING: 'start-booking',
  REGISTER_CLIENT: 'register-client',
  REJECT_REQUEST: 'reject-request',
  ACCEPT_REQUEST: 'accept-request',
  GENERAL: 'general',
};

export const ENUM_RESCHEDULE_STATUS = {
  REJECTED: 'rejected',
  ACCEPTED: 'reschedule',
  PENDING: 'pending',
};

export const ENUM_PAYMENT_PURPOSE = {
  BOOKING: 'booking',
  REFUNDS: 'refunds',
  ADMIN_FEE: 'admin_fee',
};

export const ENUM_PAYMENT_TYPE = {
  ONLINE: 'online',
  PAY_ON_SHOP: 'pay-on-shop',
};

export const ENUM_PAYMENT_METHOD = {
  STRIPE: 'stripe',
  PAY_ON_SHOP: 'pay-on-shop',
};

export const ENUM_NOTIFICATION_RECEIVER = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin',
};

export const ENUM_BOOKING_STATUS = {
  PENDING: 'pending',
  BOOKED: 'booked',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
};
