import { z } from 'zod';

const createShopCategoryValidationSchema = z.object({
  body: z.object({
    categoryName: z.string({ required_error: 'Category name is required' }),
    // profitOnCategory: z
    //   .number()
    //   .nonnegative('Profit must be a non-negative number'),
  }),
});
const updateShopCategoryValidationSchema = z.object({
  body: z
    .object({
      categoryName: z
        .string({ required_error: 'Category name is required' })
        .optional(),
      // profitOnCategory: z
      //   .number()
      //   .nonnegative('Profit must be a non-negative number')
      //   .optional(),
    })
    .optional(),
  status: z.enum(['active', 'deactivate']).optional(),
});

const shopCategoryValidations = {
  createShopCategoryValidationSchema,
  updateShopCategoryValidationSchema,
};

export default shopCategoryValidations;
