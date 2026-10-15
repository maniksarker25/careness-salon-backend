import { z } from "zod";

const createProductSchema = z.object({
  body:z.object({
    name: z.string({required_error:"Product name is required"}).min(1, "Product name is required"),
  price: z.number({required_error:"Price is required"}).min(0, "Price must be a positive number"),
  description: z.string({required_error:"Description is required"}).min(1, "Description is required"),
  piecesSold: z.number().default(0).optional(),
  product_image: z.string().optional()
  })
});
const updateProductSchema = z.object({
  body:z.object({
    name: z.string({required_error:"Product name is required"}).min(1, "Product name is required").optional(),
  price: z.number({required_error:"Price is required"}).min(0, "Price must be a positive number").optional(),
  description: z.string({required_error:"Description is required"}).min(1, "Description is required").optional(),
  piecesSold: z.number().default(0).optional(),
  product_image: z.string().optional()
  })
});

const productValidations = {
createProductSchema,
updateProductSchema
}

export default productValidations;
