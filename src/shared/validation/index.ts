/**
 * Main validation module exports
 *
 * Provides:
 * - Zod schemas for all entities
 * - Helper validators (phone, email, date, etc.)
 * - Error formatting utilities
 * - Generic validate() function
 */

import { ZodSchema, ZodError } from 'zod';
import { ValidationResult, formatZodError, getFirstZodError } from './helpers/formatters';

// Re-export all schemas
export * from './schemas';

// Re-export helpers
export * from './helpers';

/**
 * Generic validation function that wraps Zod's safeParse
 * Returns a consistent ValidationResult object
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns ValidationResult with success status and either data or errors
 *
 * @example
 * const result = validate(createPatientSchema, formData);
 * if (result.success) {
 *   // result.data is typed and validated
 *   await savePatient(result.data);
 * } else {
 *   // result.error is the first error message
 *   // result.errors is array of all errors
 *   showError(result.error);
 * }
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: getFirstZodError(result.error),
    errors: formatZodError(result.error),
  };
}

/**
 * Validates data and throws an error if validation fails
 * Useful for backend validation where you want to halt execution
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws Error with validation message if validation fails
 */
export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (result.success) {
    return result.data;
  }

  throw new Error(`Validation failed: ${getFirstZodError(result.error)}`);
}

/**
 * Type guard to check if a value is a ZodError
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}
