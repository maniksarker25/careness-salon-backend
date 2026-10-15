import {
  ENUM_BOOKING_STATUS,
  ENUM_PAYMENT_TYPE,
} from '../../utilities/enum';

/**
 * $match filter for bookings that count as earned revenue: the appointment is
 * COMPLETED (or was marked no-show, which also ends as COMPLETED). A
 * pay-on-shop no-show is excluded because the customer never paid; an online
 * no-show stays in because the customer was charged upfront.
 */
export const REVENUE_BOOKING_MATCH = {
  status: ENUM_BOOKING_STATUS.COMPLETED,
  $nor: [{ paymentType: ENUM_PAYMENT_TYPE.PAY_ON_SHOP, isNoShow: true }],
};
