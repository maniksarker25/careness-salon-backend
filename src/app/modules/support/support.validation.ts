import { z } from 'zod';

const contactSupportValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Please enter a valid email address')
      .max(254),
    phone: z
      .string()
      .trim()
      .max(30, 'Phone number is too long')
      .regex(/^[+\d\s()/-]*$/, 'Please enter a valid phone number')
      .optional(),
    userType: z.enum(['customer', 'salon', 'other']).optional(),
    message: z
      .string({ required_error: 'Message is required' })
      .trim()
      .min(10, 'Message must be at least 10 characters')
      .max(5000, 'Message is too long (max 5000 characters)'),
    // Honeypot: real users never see or fill this field.
    website: z.string().max(0).optional(),
  }),
});

export const SupportValidations = { contactSupportValidationSchema };
