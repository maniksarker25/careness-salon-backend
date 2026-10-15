import { Types } from 'mongoose';
import { z } from 'zod';

const createStaffValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Name is required.' }),
    specialty: z.string().min(1, { message: 'Specialty is required.' }),
    phoneNumber: z.string().min(1, { message: 'Phone number is required.' }),
    email: z.string().email({ message: 'Invalid email format.' }),
    employmentStartDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format for employment start date.',
    }),
    services: z
      .union([
        z.literal('all-services'),
        z.array(
          z.string().refine((id) => Types.ObjectId.isValid(id), {
            message: 'Each service ID must be a valid ObjectId.',
          }),
        ),
      ])
      .refine((val) => val === 'all-services' || val.length > 0, {
        message:
          "Services must be 'all-services' or a non-empty array of service IDs.",
      }),
  }),
});

const updateStaffValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Name is required.' }).optional(),
    specialty: z
      .string()
      .min(1, { message: 'Specialty is required.' })
      .optional(),
    phoneNumber: z.string().optional(),
    email: z.string().email({ message: 'Invalid email format.' }).optional(),
    employmentStartDate: z
      .string()
      .optional()
      .refine(
        (date) => {
          return date ? !isNaN(Date.parse(date)) : true;
        },
        {
          message: 'Invalid date format for employment start date.',
        },
      ),
    services: z
      .union([
        z.literal('all-services'),
        z.array(
          z.string().refine((id) => Types.ObjectId.isValid(id), {
            message: 'Each service ID must be a valid ObjectId.',
          }),
        ),
      ])
      .optional()
      .refine((val) => !val || val === 'all-services' || val.length > 0, {
        message:
          "Services must be 'all-services' or a non-empty array of service IDs.",
      }),
  }),
});

const getAvailableStaffValidationSchema = z.object({
  body: z.object({
    shopId: z.string(),
    services: z.array(z.string()),
  }),
});

const staffValidations = {
  createStaffValidationSchema,
  updateStaffValidationSchema,
  getAvailableStaffValidationSchema,
};

export default staffValidations;
