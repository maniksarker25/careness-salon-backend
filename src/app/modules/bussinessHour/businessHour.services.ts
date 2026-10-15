import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../error/appError';
import {
  formatSalonDate,
  formatSalonTime,
  getSalonWeekday,
  getUpcomingSalonDates,
  isValidDateOnly,
  toSalonDateTime,
} from '../../utilities/salonTime';
import BlockHour from '../blockHour/blockHour.model';
import Booking from '../booking/booking.model';
import Staff from '../staff/staff.model';
import { ENUM_BOOKING_STATUS } from '../../utilities/enum';
import { IBusinessHour } from './businessHour.interface';
import BusinessHour from './businessHour.model';
import {
  loadHoursByDay,
  normalizeTime,
  ownsBusinessHour,
  resolveEffectiveHours,
} from './businessHour.utils';

const AVAILABLE_DATES_WINDOW_DAYS = 5;
const SLOT_MINUTES = 15;
const SLOT_MS = SLOT_MINUTES * 60 * 1000;

const getStaffOrThrow = async (staffId: string) => {
  const staff = await Staff.findById(staffId).select('shop').lean();
  if (!staff) {
    throw new AppError(httpStatus.NOT_FOUND, 'Staff not found');
  }
  return staff;
};

const getAvailableDates = async (staffId: string) => {
  const staff = await getStaffOrThrow(staffId);
  const hours = await loadHoursByDay(staff.shop, staffId);
  const now = new Date();

  return getUpcomingSalonDates(AVAILABLE_DATES_WINDOW_DAYS).map((date) => {
    const day = getSalonWeekday(date);
    const effective = resolveEffectiveHours(
      hours.shop.get(day),
      hours.staff.get(day),
    );

    // a day that is already over (closing time passed today) is not bookable
    const isOver =
      effective.isOpen &&
      date === formatSalonDate() &&
      toSalonDateTime(date, effective.closeTime) <= now;

    if (!effective.isOpen || isOver) {
      return { date, day, isAvailable: false };
    }
    return {
      date,
      day,
      isAvailable: true,
      openTime: effective.openTime,
      closeTime: effective.closeTime,
    };
  });
};

const getAvailableTimeSlots = async (staffId: string, date: string) => {
  if (!isValidDateOnly(date)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Date is required in YYYY-MM-DD format',
    );
  }

  const staff = await getStaffOrThrow(staffId);
  const day = getSalonWeekday(date);

  const hours = await loadHoursByDay(staff.shop, staffId);
  const effective = resolveEffectiveHours(
    hours.shop.get(day),
    hours.staff.get(day),
  );
  // shop closed, staff closed, or no usable hours -> nothing to book
  if (!effective.isOpen) return [];

  const today = formatSalonDate();
  if (date < today) return [];

  const openTime = toSalonDateTime(date, effective.openTime);
  const closeTime = toSalonDateTime(date, effective.closeTime);

  const [blockHours, existingBookings] = await Promise.all([
    BlockHour.find({
      $or: [
        { entityId: staffId, entityType: 'Staff' },
        { entityId: staff.shop, entityType: 'Shop' },
      ],
      day,
    })
      .select('startTime endTime')
      .lean(),
    Booking.find({
      staffId,
      status: {
        $in: [ENUM_BOOKING_STATUS.PENDING, ENUM_BOOKING_STATUS.BOOKED],
      },
      startTime: { $lt: closeTime },
      endTime: { $gt: openTime },
    })
      .select('startTime endTime')
      .lean(),
  ]);

  const isToday = date === today;
  const nowMs = Date.now();
  const availableSlots = [];

  for (
    let slotStartMs = openTime.getTime();
    slotStartMs < closeTime.getTime();
    slotStartMs += SLOT_MS
  ) {
    const slotEndMs = slotStartMs + SLOT_MS;

    // skip slots that are already over today
    if (isToday && slotEndMs <= nowMs) continue;

    const time = formatSalonTime(new Date(slotStartMs));
    const isBlocked = blockHours.some(
      (bh) => time >= bh.startTime && time < bh.endTime,
    );
    if (isBlocked) continue;

    const isBooked = existingBookings.some(
      (b) =>
        slotStartMs < b.endTime.getTime() &&
        slotEndMs > b.startTime.getTime(),
    );

    availableSlots.push({ time, isBooked });
  }

  return availableSlots;
};

const getBusinessHour = async (entityId: string, entityType: string) => {
  const [businessHours, blockHours] = await Promise.all([
    BusinessHour.find({ entityId, entityType }).lean(),
    BlockHour.find({ entityId, entityType }).lean(),
  ]);

  return businessHours.map((bh) => ({
    ...bh,
    blockHours: blockHours
      .filter((block) => block.day === bh.day)
      .map(({ startTime, endTime, _id }) => ({ startTime, endTime, _id })),
  }));
};

const updateBusinessHour = async (
  userData: JwtPayload,
  id: string,
  payload: Partial<IBusinessHour>,
) => {
  const businessHour = await BusinessHour.findById(id);
  if (!businessHour) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business hour not found');
  }

  const canEdit = await ownsBusinessHour(
    businessHour.entityType,
    businessHour.entityId,
    userData.profileId,
  );
  if (!canEdit) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not allowed to update these business hours',
    );
  }

  // day / entityId / entityType are never editable. null or missing times
  // mean "leave unchanged" (apps often send null when a day is closed).
  const update: Partial<IBusinessHour> = {};
  if (typeof payload.isClosed === 'boolean') update.isClosed = payload.isClosed;
  if (payload.openTime != null) {
    const openTime = normalizeTime(payload.openTime);
    if (!openTime) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid open time format');
    }
    update.openTime = openTime;
  }
  if (payload.closeTime != null) {
    const closeTime = normalizeTime(payload.closeTime);
    if (!closeTime) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid close time format');
    }
    update.closeTime = closeTime;
  }

  // validate the resulting state, not just the patch
  const isClosed = update.isClosed ?? businessHour.isClosed;
  const openTime = update.openTime ?? businessHour.openTime;
  const closeTime = update.closeTime ?? businessHour.closeTime;
  if (!isClosed) {
    if (!openTime || !closeTime) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Open time and close time are required for an open day',
      );
    }
    if (openTime >= closeTime) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Close time must be after open time',
      );
    }
  }

  return BusinessHour.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true },
  );
};

const BusinessHourServices = {
  getAvailableDates,
  getAvailableTimeSlots,
  getBusinessHour,
  updateBusinessHour,
};

export default BusinessHourServices;
