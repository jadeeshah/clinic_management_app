/**
 * Visit validation schemas
 */

import { z } from 'zod';
import {
  dateStringSchema,
  timeStringSchema,
  optionalTimeStringSchema,
  idSchema,
  optionalIdSchema,
  notesSchema,
} from '../helpers/validators';

// Visit status enum matching database CHECK constraint
export const visitStatusEnum = z.enum([
  'Scheduled',
  'InProgress',
  'Completed',
  'Cancelled',
  'NoShow',
]);

// Visit type - dynamic from Services table (no longer a fixed enum)
export const visitTypeEnum = z.string().min(1, 'Visit type is required');

/**
 * Schema for creating a new visit
 */
export const createVisitSchema = z.object({
  patientID: idSchema,
  doctorID: idSchema,
  visitDate: dateStringSchema,
  startTime: timeStringSchema,
  endTime: optionalTimeStringSchema,
  duration: z.coerce
    .number()
    .int('Duration must be a whole number')
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration cannot exceed 8 hours')
    .default(45),
  status: visitStatusEnum.default('Scheduled'),
  visitType: visitTypeEnum.default('TherapySession'),
  notes: notesSchema,
  patientPackageID: optionalIdSchema,
});

/**
 * Schema for updating an existing visit
 */
export const updateVisitSchema = createVisitSchema.extend({
  visitID: idSchema,
});

/**
 * Schema for updating only the visit status
 */
export const updateVisitStatusSchema = z.object({
  visitID: idSchema,
  status: visitStatusEnum,
});

/**
 * Schema for querying visits
 */
export const getVisitsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: visitStatusEnum.optional(),
  doctorID: z.number().int().positive().optional(),
  patientID: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Type exports
export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
export type UpdateVisitStatusInput = z.infer<typeof updateVisitStatusSchema>;
export type GetVisitsInput = z.infer<typeof getVisitsSchema>;
