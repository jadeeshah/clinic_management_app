/**
 * Patient validation schemas
 */

import { z } from 'zod';
import {
  phoneSchema,
  optionalPhoneSchema,
  optionalEmailSchema,
  optionalDateStringSchema,
  optionalTextSchema,
  notesSchema,
  idSchema,
} from '../helpers/validators';

// Sex enum matching database CHECK constraint
export const sexEnum = z.enum(['Male', 'Female', 'Other']);

/**
 * Schema for creating a new patient
 */
export const createPatientSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less'),
  lastName: optionalTextSchema(100),
  phone: phoneSchema,
  whatsApp: optionalPhoneSchema,
  email: optionalEmailSchema,
  dateOfBirth: optionalDateStringSchema,
  sex: sexEnum.optional().nullable(),
  address: optionalTextSchema(500),
  city: optionalTextSchema(100),
  emergencyContactName: optionalTextSchema(100),
  emergencyContactPhone: optionalPhoneSchema,
  emergencyContactRelation: optionalTextSchema(50),
  notes: notesSchema,
});

/**
 * Schema for updating an existing patient
 */
export const updatePatientSchema = createPatientSchema.extend({
  patientID: idSchema,
});

/**
 * Schema for patient search/filter
 */
export const searchPatientSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Type exports inferred from schemas
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type SearchPatientInput = z.infer<typeof searchPatientSchema>;
