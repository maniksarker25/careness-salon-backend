import { z } from 'zod';

const createBlockHourValidationSchema = z.object({
  body:z.object({
    entityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid ObjectId format' }),
  entityType: z.enum(['Shop', 'Staff']),
  day: z.enum([
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format (24-hour).',
  }),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:MM format (24-hour).',
  }),
  })
});
const updateBlockHourSchema = z.object({
    body:z.object({
     day: z.enum([
         'Sunday',
         'Monday',
         'Tuesday',
         'Wednesday',
         'Thursday',
         'Friday',
         'Saturday',
       ]).optional(),
       startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid open time format").optional(), // Format: HH:mm
       endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid close time format").optional(), // Format: HH:mm
    })
   });
const blockHourValidations = {
  createBlockHourValidationSchema,
  updateBlockHourSchema
};

export default blockHourValidations;
