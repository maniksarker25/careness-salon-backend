import { z } from 'zod';
import { ENUM_GENDER } from '../../utilities/enum';

export const registerCustomerValidationSchema = z.object({
  body: z.object({
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, { message: 'Password must be 6 character' }),
    confirmPassword: z
      .string({ required_error: 'Confirm password is required' })
      .min(6, { message: 'Password must be 6 character' }),
    customer: z.object({
      firstName: z.string({
        required_error: 'First name is required',
        invalid_type_error: 'First name must be a string',
      }),
      lastName: z.string({
        required_error: 'Last name is required',
        invalid_type_error: 'Last name must be a string',
      }),
      email: z.string().email('Invalid email format'),
    }),
  }),
});
const updateCustomerProfileValidationSchema = z.object({
  body: z.object({
    firstName: z
      .string({
        required_error: 'First name is required',
        invalid_type_error: 'First name must be a string',
      })
      .optional(),
    lastName: z
      .string({
        required_error: 'Last name is required',
        invalid_type_error: 'Last name must be a string',
      })
      .optional(),
    // email: z.string().email('Invalid email format').optional(),
    phoneNumber: z
      .string()
      .min(1, 'Phone number is required')
      .max(15)
      .optional(),
    // location: z
    //   .object({
    //     type: z.literal('Point'),
    //     coordinates: z.tuple([z.number(), z.number()]),
    //   })
    //   .optional(),
    city: z.string({ required_error: 'City is required' }).optional(),
    country: z.string({ required_error: 'Country is required' }).optional(),
    gender: z.nativeEnum(ENUM_GENDER).optional(),
    age: z.string().optional(),
    profile_image: z.string().optional(),
  }),
});

// complete profile validation
const completeCustomerProfileValidationSchema = z.object({
  body: z.object({
    phoneNumber: z.string().optional(),
    gender: z.nativeEnum(ENUM_GENDER).optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  }),
});

const customerValidations = {
  registerCustomerValidationSchema,
  updateCustomerProfileValidationSchema,
  completeCustomerProfileValidationSchema,
};

export default customerValidations;
