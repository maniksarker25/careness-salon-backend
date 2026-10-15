import { z } from 'zod';

const ratingValidationSchema = z.object({
  body: z.object({
    shopRating: z
      .number({
        required_error: 'Shop rating is required',
      })
      .max(5, { message: 'Shop rating maximum 5' }),
    shopRatingDescription: z
      .string({
        required_error: 'Shop rating description is required',
      })
      .optional(),
    staffRating: z
      .number({
        required_error: 'Staff rating is required',
      })
      .max(5, { message: 'Shop rating maximum 5' }),
  }),
});

const ratingValidations = {
  ratingValidationSchema,
};

export default ratingValidations;
