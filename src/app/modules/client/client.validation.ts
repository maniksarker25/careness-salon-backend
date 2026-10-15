import { z } from 'zod';
import {
  ENUM_GENDER,
  ENUM_PAYMENT_PREFERENCES,
} from '../../utilities/enum';
const locationSchema = z
  .object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  })
  .optional();
const registerClientValidationSchema = z.object({
  body: z.object({
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, { message: 'Password must be 6 character' }),
    confirmPassword: z
      .string({ required_error: 'Confirm password is required' })
      .min(6, { message: 'Password must be 6 character' }),
    client: z.object({
      firstName: z.string({
        required_error: 'First name is required',
        invalid_type_error: 'First name must be a string',
      }),
      lastName: z.string({
        required_error: 'Last name is required',
        invalid_type_error: 'Last name must be a string',
      }),
      email: z
        .string({ required_error: 'Email is required' })
        .email({ message: 'Please provide a valid email' }),

      profile_image: z.string().optional(),
    }),
  }),
});

const addShopDetailsValidationSchema = z.object({
  body: z.object({
    phoneNumber: z.string({ required_error: 'Phone number is required' }),
    dateOfBirth: z
      .string({ required_error: 'Date of birth is required' })
      .optional(),
    shopName: z.string({ required_error: 'Shop name is required' }),
    shopCategory: z.string({ required_error: 'Shop category is required' }),
    shopCategoryId: z.string({
      required_error: 'Shop category id is required',
    }),
    shopGenderCategory: z.nativeEnum(ENUM_GENDER),
    shopImages: z.array(z.string()).optional(),
    paymentPreferences: z.enum(
      Object.values(ENUM_PAYMENT_PREFERENCES) as [string, ...string[]],
    ),
    location: locationSchema,
    address: z.string({ required_error: 'Address is required' }),
  }),
});

const addBankDetailsValidationSchema = z.object({
  body: z.object({
    bankName: z.string({ required_error: 'Bank name is required' }),
    bankAccountName: z.string({
      required_error: 'Bank account name is required',
    }),
    bankAccountNumber: z.string({
      required_error: 'Bank account number is required',
    }),
    branchCode: z.string({ required_error: 'Branch code is required' }),
    bankCity: z.string({ required_error: 'Bank city is required' }),
  }),
});

const updateClientProfileValidationSchema = z.object({
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
    // email: z
    //   .string({ required_error: 'Email is required' })
    //   .email({ message: 'Please provide a valid email' }).optional(),
    gender: z.nativeEnum(ENUM_GENDER).optional(),
    dateOfBirth: z
      .string({ required_error: 'Date of birth is required' })
      .optional(),
    shopName: z.string({ required_error: 'Shop name is required' }).optional(),
    shopCategory: z
      .string({ required_error: 'Shop category is required' })
      .nonempty()
      .optional(),
    shopGenderCategory: z.nativeEnum(ENUM_GENDER).optional(),
    shopImages: z.array(z.string()).optional(),
    location: locationSchema,
    profile_image: z.string().optional(),
    bankName: z.string({ required_error: 'Bank name is required' }).optional(),
    bankAccountName: z
      .string({ required_error: 'Bank account name is required' })
      .optional(),
    bankAccountNumber: z
      .string({ required_error: 'Bank account number is required' })
      .optional(),
    branchCode: z
      .string({ required_error: 'Branch code is required' })
      .optional(),
    bankCity: z.string({ required_error: 'Bank city is required' }).optional(),
  }),
});

const getNearbyShopValidationSchema = z.object({
  body: z.object({
    latitude: z.number({ required_error: 'Latitude is required' }),
    longitude: z.number({ required_error: 'Longitude is required' }),
  }),
});
const ClientValidations = {
  registerClientValidationSchema,
  updateClientProfileValidationSchema,
  getNearbyShopValidationSchema,
  addShopDetailsValidationSchema,
  addBankDetailsValidationSchema,
};

export default ClientValidations;
