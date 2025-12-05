/**
 * Doctor validation schemas
 */

import { z } from 'zod';
import {
  optionalPhoneSchema,
  optionalEmailSchema,
  optionalTimeStringSchema,
  nonNegativeNumberSchema,
  optionalTextSchema,
  idSchema,
} from '../helpers/validators';

// Days of the week enum
export const dayOfWeekEnum = z.enum([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]);

/**
 * Schema for creating a new doctor
 */
export const createDoctorSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name must be 100 characters or less'),
    lastName: optionalTextSchema(100),
    education: optionalTextSchema(200),
    designation: optionalTextSchema(200),
    specialization: optionalTextSchema(200),
    sessionCharge: nonNegativeNumberSchema.default(0),
    availableDays: z.array(dayOfWeekEnum).default([]),
    startTime: optionalTimeStringSchema,
    endTime: optionalTimeStringSchema,
    phone: optionalPhoneSchema,
    email: optionalEmailSchema,
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Validate endTime > startTime if both provided
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

/**
 * Schema for updating an existing doctor
 */
export const updateDoctorSchema = z
  .object({
    doctorID: idSchema,
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name must be 100 characters or less'),
    lastName: optionalTextSchema(100),
    education: optionalTextSchema(200),
    designation: optionalTextSchema(200),
    specialization: optionalTextSchema(200),
    sessionCharge: nonNegativeNumberSchema.default(0),
    availableDays: z.array(dayOfWeekEnum).default([]),
    startTime: optionalTimeStringSchema,
    endTime: optionalTimeStringSchema,
    phone: optionalPhoneSchema,
    email: optionalEmailSchema,
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

// Type exports
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
