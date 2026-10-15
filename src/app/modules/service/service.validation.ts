import { z } from 'zod';

const createServiceValidationSchema = z.object({
 body:z.object({
    serviceName: z.string().min(1, { message: 'Service name is required' }),
    availableFor: z.enum(['Everyone', 'Male', 'Female'], {
      required_error: 'Available for is required',
    }),
    durationMinutes: z
      .number()
      .int()
      .positive({ message: 'Duration must be a positive integer' }),
    price: z.number().positive({ message: 'Price must be a positive number' }),
 })
});
 const updateServiceValidationSchema = z.object({
 body:z.object({
    serviceName: z.string().min(1, { message: 'Service name is required' }).optional(),
    availableFor: z.enum(['Everyone', 'Male', 'Female'], {
      required_error: 'Available for is required',
    }).optional(),
    durationMinutes: z
      .number()
      .int()
      .positive({ message: 'Duration must be a positive integer' }).optional(),
    price: z.number().positive({ message: 'Price must be a positive number' }).optional(),
 })
});




const serviceValidation = {
    createServiceValidationSchema,
    updateServiceValidationSchema
}

export default serviceValidation;