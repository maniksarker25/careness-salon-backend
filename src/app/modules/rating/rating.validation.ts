import { z } from 'zod';

const ratingValidationSchema = z.object({
  body: z.object({
    shopRating: z
      .number({
        required_error: 'Shop rating is required',
      })
      .min(1, { message: 'Shop rating minimum 1' })
      .max(5, { message: 'Shop rating maximum 5' }),
    shopRatingDescription: z
      .string()
      .trim()
      .max(2000, { message: 'Review text is too long (max 2000 characters)' })
      .optional(),
    staffRating: z
      .number({
        required_error: 'Staff rating is required',
      })
      .min(1, { message: 'Staff rating minimum 1' })
      .max(5, { message: 'Staff rating maximum 5' }),
  }),
});

const ratingValidations = {
  ratingValidationSchema,
};

export default ratingValidations;
