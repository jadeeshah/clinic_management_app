/**
 * Package validation schemas
 */

import { z } from 'zod';
import {
  nonNegativeNumberSchema,
  idSchema,
  optionalIdSchema,
  dateStringSchema,
} from '../helpers/validators';

/**
 * Schema for creating a new package
 */
export const createPackageSchema = z.object({
  name: z
    .string()
    .min(1, 'Package name is required')
    .max(200, 'Package name must be 200 characters or less'),
  totalSessions: z
    .number()
    .int('Total sessions must be a whole number')
    .min(1, 'Package must include at least 1 session'),
  price: nonNegativeNumberSchema,
  validityDays: z
    .number()
    .int('Validity days must be a whole number')
    .min(1, 'Validity must be at least 1 day')
    .default(30),
});

/**
 * Schema for updating an existing package
 */
export const updatePackageSchema = createPackageSchema.extend({
  packageID: idSchema,
});

/**
 * Schema for assigning a package to a patient
 */
export const createPatientPackageSchema = z.object({
  patientID: idSchema,
  packageID: idSchema,
  purchaseDate: dateStringSchema,
  expiryDate: dateStringSchema,
  paidAmount: nonNegativeNumberSchema.default(0),
});

/**
 * Schema for updating a patient package
 */
export const updatePatientPackageSchema = createPatientPackageSchema.extend({
  patientPackageID: idSchema,
});

// Type exports
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type CreatePatientPackageInput = z.infer<typeof createPatientPackageSchema>;
export type UpdatePatientPackageInput = z.infer<typeof updatePatientPackageSchema>;
