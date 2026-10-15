import { z } from 'zod';

const addToCartValidationSchema = z.object({
  body: z.object({
    shopId: z.string({ required_error: 'Shop id is required' }),
    productId: z.string({ required_error: 'Product id is required' }),
  }),
});

const removeCartItemValidationSchema = z.object({
  body: z.object({
    productId: z.string({ required_error: 'Product id is required' }),
  }),
});
const cartValidations = {
  addToCartValidationSchema,
  removeCartItemValidationSchema,
};

export default cartValidations;
