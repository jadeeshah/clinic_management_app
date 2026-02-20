/**
 * Investigation validation schemas
 */

import { z } from 'zod';
import {
  idSchema,
  dateStringSchema,
  notesSchema,
  optionalTextSchema,
} from '../helpers/validators';

// Investigation type enum matching database CHECK constraint
export const investigationTypeEnum = z.enum([
  'X-Ray',
  'CT Scan',
  'MRI',
  'Ultrasound',
  'NCS',
  'EMG',
  'Blood Test',
  'Urine Test',
  'ECG',
  'DEXA Scan',
  'Bone Scan',
  'Other',
]);

// Investigation status enum
export const investigationStatusEnum = z.enum([
  'Ordered',
  'Scheduled',
  'Completed',
  'Reviewed',
]);

/**
 * Schema for creating a new investigation
 */
export const createInvestigationSchema = z.object({
  patientID: idSchema,
  investigationType: investigationTypeEnum,
  investigationDate: dateStringSchema,
  orderedByDoctorID: idSchema.optional().nullable(),
  bodyPart: optionalTextSchema(200),
  findings: optionalTextSchema(2000),
  status: investigationStatusEnum.optional().default('Ordered'),
  notes: notesSchema,
});

/**
 * Schema for updating an existing investigation
 */
export const updateInvestigationSchema = createInvestigationSchema.extend({
  investigationID: idSchema,
});

// Type exports inferred from schemas
export type CreateInvestigationInput = z.infer<typeof createInvestigationSchema>;
export type UpdateInvestigationInput = z.infer<typeof updateInvestigationSchema>;
