import { z } from 'zod';

const bookingRescheduleSchema = z.object({
  body: z.object({
    bookingId: z.string({ required_error: 'Booking id is required' }),
    rescheduleDate: z.string({ required_error: 'Reschedule date is required' }),
    rescheduleTime: z
      .string({ required_error: 'Reschedule time is required' })
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Invalid time format, expected HH:mm',
      }),
  }),
});

const changeRescheduleRequestStatusSchema = z.object({
  body: z.object({
    status: z.enum(['accept', 'reject'], {
      required_error: 'Status is required',
    }),
  }),
});

const BookingRescheduleValidations = {
  bookingRescheduleSchema,
  changeRescheduleRequestStatusSchema,
};

export default BookingRescheduleValidations;
