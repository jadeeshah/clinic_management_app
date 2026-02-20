/**
 * Reusable Zod validators for common field types
 */

import { z } from 'zod';

// Phone number validation (supports Pakistan format + international)
// Allows digits, spaces, hyphens, plus, parentheses
export const phoneSchema = z
  .string()
  .min(7, 'Phone number too short')
  .max(20, 'Phone number too long')
  .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format');

// Optional phone - allows empty string or null
export const optionalPhoneSchema = z
  .string()
  .regex(/^[\d\s\-+()]*$/, 'Invalid phone number format')
  .optional()
  .nullable()
  .or(z.literal(''));

// Email validation (required)
export const emailSchema = z
  .string()
  .email('Invalid email format');

// Optional email - allows empty string or null
export const optionalEmailSchema = z
  .string()
  .email('Invalid email format')
  .optional()
  .nullable()
  .or(z.literal(''));

// Date string validation (YYYY-MM-DD format)
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

// Optional date string
export const optionalDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
  .optional()
  .nullable()
  .or(z.literal(''));

// Time string validation (HH:MM format)
export const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)');

// Optional time string
export const optionalTimeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)')
  .optional()
  .nullable()
  .or(z.literal(''));

// Non-negative number (>= 0) - uses coerce to handle string inputs from forms
export const nonNegativeNumberSchema = z.coerce
  .number()
  .nonnegative('Value must be non-negative');

// Positive number (> 0) - uses coerce to handle string inputs from forms
export const positiveNumberSchema = z.coerce
  .number()
  .positive('Value must be positive');

// Entity ID validation (positive integer) - uses coerce for flexibility
export const idSchema = z.coerce
  .number()
  .int('ID must be an integer')
  .positive('ID must be positive');

// Optional ID (for foreign keys that can be null)
export const optionalIdSchema = z.coerce
  .number()
  .int('ID must be an integer')
  .positive('ID must be positive')
  .optional()
  .nullable();

// Text field with max length
export const shortTextSchema = (maxLength: number = 100) => z
  .string()
  .max(maxLength, `Text must be ${maxLength} characters or less`);

// Required text field with min 1 char
export const requiredTextSchema = (fieldName: string, maxLength: number = 100) => z
  .string()
  .min(1, `${fieldName} is required`)
  .max(maxLength, `${fieldName} must be ${maxLength} characters or less`);

// Optional text field
export const optionalTextSchema = (maxLength: number = 100) => z
  .string()
  .max(maxLength, `Text must be ${maxLength} characters or less`)
  .optional()
  .nullable()
  .or(z.literal(''));

// Notes/long text field
export const notesSchema = z
  .string()
  .max(5000, 'Notes must be 5000 characters or less')
  .optional()
  .nullable()
  .or(z.literal(''));
