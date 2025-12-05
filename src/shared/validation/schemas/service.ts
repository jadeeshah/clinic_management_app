/**
 * Service validation schemas
 */

import { z } from 'zod';
import {
  nonNegativeNumberSchema,
  optionalTextSchema,
  idSchema,
} from '../helpers/validators';

/**
 * Schema for creating a new service
 */
export const createServiceSchema = z.object({
  code: z
    .string()
    .min(1, 'Service code is required')
    .max(50, 'Service code must be 50 characters or less')
    .regex(
      /^[A-Z0-9\-]+$/,
      'Service code must be uppercase letters, numbers, and hyphens only'
    ),
  name: z
    .string()
    .min(1, 'Service name is required')
    .max(200, 'Service name must be 200 characters or less'),
  defaultPrice: nonNegativeNumberSchema.default(0),
  category: optionalTextSchema(100),
});

/**
 * Schema for updating an existing service
 */
export const updateServiceSchema = createServiceSchema.extend({
  serviceID: idSchema,
});

// Type exports
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
