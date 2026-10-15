import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

// All salons currently operate in Germany. Business hours, block hours and
// booking times are entered/displayed in this timezone, regardless of the
// server's own timezone.
export const SALON_TIMEZONE = 'Europe/Berlin';

/**
 * Combines a "YYYY-MM-DD" date and "HH:mm" time, both expressed in the
 * salon's local timezone, into the correct absolute UTC instant.
 * Handles the CET/CEST (Europe/Berlin) DST offset automatically.
 */
export const toSalonDateTime = (date: string | Date, time: string): Date => {
  const dateStr =
    typeof date === 'string' ? date.slice(0, 10) : dayjs(date).format('YYYY-MM-DD');
  return dayjs.tz(`${dateStr} ${time}`, 'YYYY-MM-DD HH:mm', SALON_TIMEZONE).toDate();
};

/** "HH:mm" (24h) of the given instant, as seen in the salon's local timezone. */
export const formatSalonTime = (date: Date): string =>
  dayjs(date).tz(SALON_TIMEZONE).format('HH:mm');

/** "YYYY-MM-DD" calendar date of the given instant in the salon's local timezone. */
export const formatSalonDate = (date: Date = new Date()): string =>
  dayjs(date).tz(SALON_TIMEZONE).format('YYYY-MM-DD');

export const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** True if `value` is a real calendar date in "YYYY-MM-DD" form. */
export const isValidDateOnly = (value: unknown): value is string =>
  typeof value === 'string' &&
  DATE_ONLY_REGEX.test(value) &&
  dayjs.utc(value, 'YYYY-MM-DD', true).isValid();

/**
 * Weekday name ("Monday"...) of a calendar date. A "YYYY-MM-DD" date has the
 * same weekday everywhere, so this is independent of the server timezone.
 */
export const getSalonWeekday = (date: string | Date): string => {
  const dateStr =
    typeof date === 'string' ? date.slice(0, 10) : formatSalonDate(date);
  return dayjs.utc(dateStr).format('dddd');
};

/** The next `count` calendar dates starting today (salon time), as "YYYY-MM-DD". */
export const getUpcomingSalonDates = (count: number): string[] => {
  const today = dayjs.utc(formatSalonDate());
  return Array.from({ length: count }, (_, i) =>
    today.add(i, 'day').format('YYYY-MM-DD'),
  );
};

/* -------------------------------------------------------------------------- */
/* Calendar ranges (salon local time)                                          */
/* -------------------------------------------------------------------------- */
// Use these instead of `setHours(0,0,0,0)` / `new Date(year, month, 1)`, which
// silently depend on the server's own timezone. Each returns a real UTC
// instant (Date) that is correct for Europe/Berlin, including DST days.

type SalonUnit = 'day' | 'month' | 'year';

/** Start (00:00:00.000 salon time) of the day/month/year containing `date`. */
export const startOfSalon = (unit: SalonUnit, date: Date = new Date()): Date =>
  dayjs(date).tz(SALON_TIMEZONE).startOf(unit).toDate();

/** End (last millisecond, salon time) of the day/month/year containing `date`. */
export const endOfSalon = (unit: SalonUnit, date: Date = new Date()): Date =>
  dayjs(date).tz(SALON_TIMEZONE).endOf(unit).toDate();

/** Start of the month `offset` months away from the month of `date` (-1 = previous). */
export const startOfSalonMonthOffset = (
  offset: number,
  date: Date = new Date(),
): Date =>
  dayjs(date).tz(SALON_TIMEZONE).startOf('month').add(offset, 'month').toDate();

/** Start of the given calendar year (e.g. 2026) in salon time. */
export const startOfSalonYear = (year: number): Date =>
  dayjs.tz(`${year}-01-01 00:00`, 'YYYY-MM-DD HH:mm', SALON_TIMEZONE).toDate();

/** End of the given calendar year in salon time. */
export const endOfSalonYear = (year: number): Date =>
  dayjs
    .tz(`${year}-12-31 00:00`, 'YYYY-MM-DD HH:mm', SALON_TIMEZONE)
    .endOf('day')
    .toDate();

/* -------------------------------------------------------------------------- */
/* Human readable formatting (salon local time)                                */
/* -------------------------------------------------------------------------- */

/** "DD/MM/YY" of the instant in salon time, e.g. "12/02/24". */
export const formatSalonDisplayDate = (date: Date): string =>
  dayjs(date).tz(SALON_TIMEZONE).format('DD/MM/YY');

/** 12-hour clock of the instant in salon time, e.g. "5:00 pm", "12:30 am". */
export const formatSalonDisplayTime = (date: Date): string =>
  dayjs(date).tz(SALON_TIMEZONE).format('h:mm a');

/** Timestamp "YYYYMMDDHHmmss" of the instant in salon time (file names etc.). */
export const formatSalonCompactTimestamp = (date: Date = new Date()): string =>
  dayjs(date).tz(SALON_TIMEZONE).format('YYYYMMDDHHmmss');
