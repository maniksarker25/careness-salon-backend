import { z } from 'zod';

const loginValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email(),
    // phoneNumber: z.string({ required_error: 'Phone number is required' }),
    password: z.string({ required_error: 'Password is required' }).min(8),
  }),
});

const changePasswordValidationSchema = z.object({
  body: z.object({
    oldPassword: z.string({ required_error: 'Old password is required' }),
    newPassword: z.string({ required_error: 'New Password is required' }).min(8),
    confirmNewPassword: z
      .string({ required_error: 'Confirm new password is required' })
      .min(8),
  }),
});

// refresh token validation schema -----------
const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' }),
  }),
});

// forget password validation schema
const forgetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email(),
  }),
});
// reset password validation schema
const resetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email(),
    password: z.string({ required_error: 'Password is required' }).min(8),
    confirmPassword: z.string({
      required_error: 'Confirm password is required',
    }).min(8),
  }),
});

const verifyResetOtpValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email(),
    resetCode: z.number({
      required_error: 'Reset code is required',
      invalid_type_error: 'Reset code must be number',
    }),
  }),
});

const resendResetCodeValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email(),
  }),
});

const authValidations = {
  loginValidationSchema,
  changePasswordValidationSchema,
  refreshTokenValidationSchema,
  forgetPasswordValidationSchema,
  resetPasswordValidationSchema,
  verifyResetOtpValidationSchema,
  resendResetCodeValidationSchema,
};

export default authValidations;
