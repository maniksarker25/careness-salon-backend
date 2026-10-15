import { z } from 'zod';

const createCategoryValidationSchema = z.object({
  body: z.object({
    categoryName: z
      .string({ required_error: 'Category name is required' })
      .min(1, 'Category name is required'),
    appointmentColor: z.string({
      required_error: 'Appointment color is required',
    }),
  }),
});
const updateCategoryValidationSchema = z.object({
  body: z.object({
    categoryName: z
      .string({ required_error: 'Category name is required' })
      .min(1, 'Category name is required')
      .optional(),
    appointmentColor: z
      .string({ required_error: 'Appointment color is required' })
      .optional(),
  }),
});

export const createSubCategoryValidationSchema = z.object({
  body: z.object({
    category: z.string({ required_error: 'Category is required' }),
    name: z
      .string({ required_error: 'Name is required' })
      .min(1, 'Name is required'),

    image: z
      .string()
      .url('Image must be a valid URL')
      .min(1, 'Image is required')
      .optional(),
  }),
});
export const updateSubCategoryValidationSchema = z.object({
  body: z.object({
    category: z.string({ required_error: 'Category is required' }).optional(),
    name: z
      .string({ required_error: 'Name is required' })
      .min(1, 'Name is required')
      .optional(),
    image: z
      .string()
      .url('Image must be a valid URL')
      .min(1, 'Image is required')
      .optional(),
  }),
});

const categoryValidation = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};

export default categoryValidation;
