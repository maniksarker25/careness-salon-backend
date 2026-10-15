import httpStatus from 'http-status';
import { Types } from 'mongoose';
import AppError from '../../error/appError';
import { getSalonWeekday, toSalonDateTime } from '../../utilities/salonTime';
import Staff from '../staff/staff.model';
import BusinessHour from './businessHour.model';

export type TDayHours = {
  isClosed?: boolean;
  openTime?: string | null;
  closeTime?: string | null;
};

export type TEffectiveHours =
  | { isOpen: false }
  | { isOpen: true; openTime: string; closeTime: string };

const CLOSED: TEffectiveHours = { isOpen: false };

const TIME_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** Normalizes "9:00" -> "09:00". Returns null for anything that isn't a time. */
export const normalizeTime = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const match = TIME_REGEX.exec(value.trim());
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null;
};

const isUsable = (hours?: TDayHours | null): hours is Required<TDayHours> =>
  !!hours &&
  !hours.isClosed &&
  !!normalizeTime(hours.openTime) &&
  !!normalizeTime(hours.closeTime);

/**
 * Single source of truth for "when can this staff member be booked on a day".
 * A day is bookable only if BOTH the shop and the staff member are open, and
 * the bookable window is the overlap of the two. Because it is derived from
 * the current records on every call, closing a shop day (or changing hours)
 * takes effect immediately for customers - nothing has to be copied or synced.
 * Missing records are treated as closed (fail safe).
 */
export const resolveEffectiveHours = (
  shopHours?: TDayHours | null,
  staffHours?: TDayHours | null,
): TEffectiveHours => {
  if (!isUsable(shopHours) || !isUsable(staffHours)) return CLOSED;

  // "HH:mm" strings compare correctly in lexical order.
  const openTime = [
    normalizeTime(shopHours.openTime)!,
    normalizeTime(staffHours.openTime)!,
  ].sort()[1];
  const closeTime = [
    normalizeTime(shopHours.closeTime)!,
    normalizeTime(staffHours.closeTime)!,
  ].sort()[0];

  return openTime < closeTime ? { isOpen: true, openTime, closeTime } : CLOSED;
};

/** Loads shop + staff hours (one query) and indexes them by weekday. */
export const loadHoursByDay = async (shopId: unknown, staffId: unknown) => {
  const records = await BusinessHour.find({
    $or: [
      { entityId: shopId, entityType: 'Shop' },
      { entityId: staffId, entityType: 'Staff' },
    ],
  })
    .select('entityType day openTime closeTime isClosed')
    .lean();

  const shop = new Map<string, TDayHours>();
  const staff = new Map<string, TDayHours>();
  for (const record of records) {
    (record.entityType === 'Shop' ? shop : staff).set(record.day, record);
  }
  return { shop, staff };
};

/**
 * Throws unless the whole appointment [startDate, endDate) lies inside the
 * shop's and the staff member's working hours for that salon-local date.
 * Used by every code path that creates or moves a booking.
 */
export const assertWithinBusinessHours = async (params: {
  shopId: unknown;
  staffId: unknown;
  date: string | Date;
  startDate: Date;
  endDate: Date;
}) => {
  const { shopId, staffId, date, startDate, endDate } = params;

  const staff = await Staff.findById(staffId).select('shop').lean();
  if (!staff) {
    throw new AppError(httpStatus.NOT_FOUND, 'Staff not found');
  }
  if (String(staff.shop) !== String(shopId)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This staff member does not belong to the selected shop',
    );
  }

  const day = getSalonWeekday(date);
  const hours = await loadHoursByDay(shopId, staffId);
  const effective = resolveEffectiveHours(hours.shop.get(day), hours.staff.get(day));

  if (!effective.isOpen) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `The shop or staff member is closed on ${day}. Please choose a different day.`,
    );
  }

  const open = toSalonDateTime(date, effective.openTime);
  const close = toSalonDateTime(date, effective.closeTime);
  if (startDate < open || endDate > close) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `The selected time is outside working hours (${effective.openTime} - ${effective.closeTime}). Please choose a different time.`,
    );
  }
};

/** True if `userProfileId` owns the shop or staff member the hours belong to. */
export const ownsBusinessHour = async (
  entityType: 'Shop' | 'Staff',
  entityId: Types.ObjectId | string,
  userProfileId: string,
): Promise<boolean> => {
  if (entityType === 'Shop') return String(entityId) === String(userProfileId);
  return !!(await Staff.exists({ _id: entityId, shop: userProfileId }));
};
