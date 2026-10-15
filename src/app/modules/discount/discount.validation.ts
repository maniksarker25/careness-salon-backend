import { z } from 'zod';
import { Types } from 'mongoose';

const createDiscountSchema = z.object({
  body: z
    .object({
      discountPercentage: z
        .number()
        .min(0, 'Discount percentage must be at least 0')
        .max(50, 'Discount percentage cannot exceed 50')
        .refine((val) => val % 5 === 0, {
          message: 'Discount percentage must be in increments of 5',
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
      // products: z
      // .union([
      //   z.literal('all-products'),
      //   z.array(
      //     z.string().refine((id) => Types.ObjectId.isValid(id), {
      //       message: 'Each service ID must be a valid ObjectId.',
      //     }),
      //   ),
      // ])
      // .refine((val) => val === 'all-products' || val.length > 0, {
      //   message:
      //     "Products must be 'all-products' or a non-empty array of product IDs.",
      // }),
      discountStartDate: z
        .string()
        .refine((date) => !isNaN(new Date(date).getTime()), {
          message: 'Invalid start date',
        }),
      discountEndDate: z
        .string()
        .refine((date) => !isNaN(new Date(date).getTime()), {
          message: 'Invalid end date',
        }),
    })
    .superRefine((data, ctx) => {
      const startDate = new Date(data.discountStartDate);
      const endDate = new Date(data.discountEndDate);

      if (endDate <= startDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['discountEndDate'],
          message: 'End date must be after start date',
        });
      }
    }),
});
const updateDiscountSchema = z.object({
  body: z
    .object({
      discountPercentage: z
        .number()
        .min(0, 'Discount percentage must be at least 0')
        .max(50, 'Discount percentage cannot exceed 50')
        .refine((val) => val % 5 === 0, {
          message: 'Discount percentage must be in increments of 5',
        })
        .optional(),
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
        })
        .optional(),
      products: z
        .union([
          z.literal('all-products'),
          z.array(
            z.string().refine((id) => Types.ObjectId.isValid(id), {
              message: 'Each service ID must be a valid ObjectId.',
            }),
          ),
        ])
        .refine((val) => val === 'all-products' || val.length > 0, {
          message:
            "Products must be 'all-products' or a non-empty array of product IDs.",
        })
        .optional(),
      discountStartDate: z
        .string()
        .refine((date) => !isNaN(new Date(date).getTime()), {
          message: 'Invalid start date',
        }),
      discountEndDate: z
        .string()
        .refine((date) => !isNaN(new Date(date).getTime()), {
          message: 'Invalid end date',
        }),
    })
    .superRefine((data, ctx) => {
      const startDate = new Date(data.discountStartDate);
      const endDate = new Date(data.discountEndDate);

      if (endDate <= startDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['discountEndDate'],
          message: 'End date must be after start date',
        });
      }
    }),
});

const discountValidations = {
  createDiscountSchema,
  updateDiscountSchema,
};

export default discountValidations;
