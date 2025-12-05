/**
 * Error formatting utilities for Zod validation
 */

import { ZodError, ZodIssue } from 'zod';

/**
 * Represents a single validation error with field path and message
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Represents the result of a validation operation
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

/**
 * Convert ZodError to array of ValidationError objects
 */
export function formatZodError(error: ZodError): ValidationError[] {
  return error.issues.map((issue: ZodIssue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Convert ZodError to a single string with all errors
 * Format: "field1: message1; field2: message2"
 */
export function formatZodErrorAsString(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}

/**
 * Get the first error message from a ZodError
 */
export function getFirstZodError(error: ZodError): string {
  const firstIssue = error.issues[0];
  if (!firstIssue) {
    return 'Validation failed';
  }
  const path = firstIssue.path.join('.');
  return path ? `${path}: ${firstIssue.message}` : firstIssue.message;
}

/**
 * Convert ZodError to a Record mapping field names to error messages
 * Useful for form error display
 */
export function formatZodErrorAsRecord(error: ZodError): Record<string, string> {
  const record: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const field = issue.path.join('.') || '_root';
    // Only keep the first error per field
    if (!record[field]) {
      record[field] = issue.message;
    }
  });
  return record;
}

/**
 * Check if a field has an error in the ZodError
 */
export function hasFieldError(error: ZodError, fieldPath: string): boolean {
  return error.issues.some((issue) => issue.path.join('.') === fieldPath);
}

/**
 * Get error message for a specific field from ZodError
 */
export function getFieldError(error: ZodError, fieldPath: string): string | undefined {
  const issue = error.issues.find((i) => i.path.join('.') === fieldPath);
  return issue?.message;
}
