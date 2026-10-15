import { z } from 'zod';

const getBusinessHourValidationSchema = z.object({
  body: z.object({
    entityId: z.string({ required_error: 'Entity id is required' }),
    entityType: z.string({ required_error: 'Entity type is required' }),
  }),
});

// "9:00" and "09:00" are both accepted (the service normalizes to "HH:mm");
// null is accepted because apps commonly send it for a closed day.
const timeSchema = (message: string) =>
  z
    .string()
    .regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, message)
    .nullish();

const updateBusinessHourSchema = z.object({
  body: z.object({
    day: z
      .enum([
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ])
      .optional(),
    openTime: timeSchema('Invalid open time format'),
    closeTime: timeSchema('Invalid close time format'),
    isClosed: z.boolean().optional(),
  }),
});

const businessHourValidations = {
  getBusinessHourValidationSchema,
  updateBusinessHourSchema,
};

export default businessHourValidations;
