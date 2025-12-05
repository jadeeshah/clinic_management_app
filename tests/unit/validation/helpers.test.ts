/**
 * Validation Helper Tests
 * Tests for helper validators and formatters
 */

import { z } from 'zod';
import {
  phoneSchema,
  optionalPhoneSchema,
  optionalEmailSchema,
  dateStringSchema,
  timeStringSchema,
  positiveNumberSchema,
  nonNegativeNumberSchema,
  idSchema,
  optionalIdSchema,
  optionalTextSchema,
  notesSchema,
  formatZodError,
  formatZodErrorAsString,
  getFirstZodError,
} from '../../../src/shared/validation';

describe('Validation Helpers', () => {
  describe('Phone Validators', () => {
    describe('phoneSchema', () => {
      it('should accept valid phone number', () => {
        const result = phoneSchema.safeParse('03001234567');
        expect(result.success).toBe(true);
      });

      it('should accept phone with dashes', () => {
        const result = phoneSchema.safeParse('0300-1234567');
        expect(result.success).toBe(true);
      });

      it('should accept phone with spaces', () => {
        const result = phoneSchema.safeParse('0300 123 4567');
        expect(result.success).toBe(true);
      });

      it('should accept phone with country code', () => {
        const result = phoneSchema.safeParse('+92 300 1234567');
        expect(result.success).toBe(true);
      });

      it('should accept phone with parentheses', () => {
        const result = phoneSchema.safeParse('(0300) 1234567');
        expect(result.success).toBe(true);
      });

      it('should reject phone with letters', () => {
        const result = phoneSchema.safeParse('0300-ABC-1234');
        expect(result.success).toBe(false);
      });

      it('should reject too short phone number', () => {
        const result = phoneSchema.safeParse('12345');
        expect(result.success).toBe(false);
      });

      it('should reject too long phone number', () => {
        const result = phoneSchema.safeParse('12345678901234567890123');
        expect(result.success).toBe(false);
      });

      it('should reject empty string', () => {
        const result = phoneSchema.safeParse('');
        expect(result.success).toBe(false);
      });
    });

    describe('optionalPhoneSchema', () => {
      it('should accept valid phone number', () => {
        const result = optionalPhoneSchema.safeParse('03001234567');
        expect(result.success).toBe(true);
      });

      it('should accept null', () => {
        const result = optionalPhoneSchema.safeParse(null);
        expect(result.success).toBe(true);
      });

      it('should accept undefined', () => {
        const result = optionalPhoneSchema.safeParse(undefined);
        expect(result.success).toBe(true);
      });

      it('should accept empty string', () => {
        const result = optionalPhoneSchema.safeParse('');
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Email Validators', () => {
    describe('optionalEmailSchema', () => {
      it('should accept valid email', () => {
        const result = optionalEmailSchema.safeParse('user@example.com');
        expect(result.success).toBe(true);
      });

      it('should accept complex email', () => {
        const result = optionalEmailSchema.safeParse('user.name+tag@subdomain.example.co.uk');
        expect(result.success).toBe(true);
      });

      it('should accept null', () => {
        const result = optionalEmailSchema.safeParse(null);
        expect(result.success).toBe(true);
      });

      it('should accept undefined', () => {
        const result = optionalEmailSchema.safeParse(undefined);
        expect(result.success).toBe(true);
      });

      it('should accept empty string', () => {
        const result = optionalEmailSchema.safeParse('');
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const result = optionalEmailSchema.safeParse('not-an-email');
        expect(result.success).toBe(false);
      });

      it('should reject email without domain', () => {
        const result = optionalEmailSchema.safeParse('user@');
        expect(result.success).toBe(false);
      });

      it('should reject email without @', () => {
        const result = optionalEmailSchema.safeParse('userexample.com');
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Date Validators', () => {
    describe('dateStringSchema', () => {
      it('should accept valid date YYYY-MM-DD', () => {
        const result = dateStringSchema.safeParse('2024-01-15');
        expect(result.success).toBe(true);
      });

      it('should accept date with leading zeros', () => {
        const result = dateStringSchema.safeParse('2024-01-01');
        expect(result.success).toBe(true);
      });

      it('should reject DD-MM-YYYY format', () => {
        const result = dateStringSchema.safeParse('15-01-2024');
        expect(result.success).toBe(false);
      });

      it('should reject MM/DD/YYYY format', () => {
        const result = dateStringSchema.safeParse('01/15/2024');
        expect(result.success).toBe(false);
      });

      it('should reject incomplete date', () => {
        const result = dateStringSchema.safeParse('2024-01');
        expect(result.success).toBe(false);
      });

      it('should reject date without leading zeros', () => {
        const result = dateStringSchema.safeParse('2024-1-5');
        expect(result.success).toBe(false);
      });

      it('should reject empty string', () => {
        const result = dateStringSchema.safeParse('');
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Time Validators', () => {
    describe('timeStringSchema', () => {
      it('should accept valid time HH:MM', () => {
        const result = timeStringSchema.safeParse('09:00');
        expect(result.success).toBe(true);
      });

      it('should accept midnight', () => {
        const result = timeStringSchema.safeParse('00:00');
        expect(result.success).toBe(true);
      });

      it('should accept end of day', () => {
        const result = timeStringSchema.safeParse('23:59');
        expect(result.success).toBe(true);
      });

      it('should reject single digit hour', () => {
        const result = timeStringSchema.safeParse('9:00');
        expect(result.success).toBe(false);
      });

      it('should reject time with seconds', () => {
        const result = timeStringSchema.safeParse('09:00:00');
        expect(result.success).toBe(false);
      });

      it('should reject 12-hour format with AM/PM', () => {
        const result = timeStringSchema.safeParse('09:00 AM');
        expect(result.success).toBe(false);
      });

      it('should reject empty string', () => {
        const result = timeStringSchema.safeParse('');
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Number Validators', () => {
    describe('positiveNumberSchema', () => {
      it('should accept positive integer', () => {
        const result = positiveNumberSchema.safeParse(100);
        expect(result.success).toBe(true);
      });

      it('should accept positive decimal', () => {
        const result = positiveNumberSchema.safeParse(99.99);
        expect(result.success).toBe(true);
      });

      it('should accept very small positive number', () => {
        const result = positiveNumberSchema.safeParse(0.01);
        expect(result.success).toBe(true);
      });

      it('should reject zero', () => {
        const result = positiveNumberSchema.safeParse(0);
        expect(result.success).toBe(false);
      });

      it('should reject negative number', () => {
        const result = positiveNumberSchema.safeParse(-100);
        expect(result.success).toBe(false);
      });

      it('should reject string', () => {
        const result = positiveNumberSchema.safeParse('100');
        expect(result.success).toBe(false);
      });
    });

    describe('nonNegativeNumberSchema', () => {
      it('should accept positive number', () => {
        const result = nonNegativeNumberSchema.safeParse(100);
        expect(result.success).toBe(true);
      });

      it('should accept zero', () => {
        const result = nonNegativeNumberSchema.safeParse(0);
        expect(result.success).toBe(true);
      });

      it('should reject negative number', () => {
        const result = nonNegativeNumberSchema.safeParse(-1);
        expect(result.success).toBe(false);
      });
    });

  });

  describe('ID Validators', () => {
    describe('idSchema', () => {
      it('should accept positive integer ID', () => {
        const result = idSchema.safeParse(1);
        expect(result.success).toBe(true);
      });

      it('should accept large ID', () => {
        const result = idSchema.safeParse(999999);
        expect(result.success).toBe(true);
      });

      it('should reject zero', () => {
        const result = idSchema.safeParse(0);
        expect(result.success).toBe(false);
      });

      it('should reject negative ID', () => {
        const result = idSchema.safeParse(-1);
        expect(result.success).toBe(false);
      });

      it('should reject decimal ID', () => {
        const result = idSchema.safeParse(1.5);
        expect(result.success).toBe(false);
      });

      it('should reject string ID', () => {
        const result = idSchema.safeParse('1');
        expect(result.success).toBe(false);
      });
    });

    describe('optionalIdSchema', () => {
      it('should accept positive integer ID', () => {
        const result = optionalIdSchema.safeParse(1);
        expect(result.success).toBe(true);
      });

      it('should accept null', () => {
        const result = optionalIdSchema.safeParse(null);
        expect(result.success).toBe(true);
      });

      it('should accept undefined', () => {
        const result = optionalIdSchema.safeParse(undefined);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Text Validators', () => {
    describe('optionalTextSchema', () => {
      it('should accept valid text within max length', () => {
        const schema = optionalTextSchema(100);
        const result = schema.safeParse('Some text');
        expect(result.success).toBe(true);
      });

      it('should reject text exceeding max length', () => {
        const schema = optionalTextSchema(10);
        const result = schema.safeParse('This is a very long text');
        expect(result.success).toBe(false);
      });

      it('should accept null', () => {
        const schema = optionalTextSchema(100);
        const result = schema.safeParse(null);
        expect(result.success).toBe(true);
      });

      it('should accept empty string', () => {
        const schema = optionalTextSchema(100);
        const result = schema.safeParse('');
        expect(result.success).toBe(true);
      });
    });

    describe('notesSchema', () => {
      it('should accept valid notes', () => {
        const result = notesSchema.safeParse('This is a note about the patient.');
        expect(result.success).toBe(true);
      });

      it('should accept null', () => {
        const result = notesSchema.safeParse(null);
        expect(result.success).toBe(true);
      });

      it('should accept empty string', () => {
        const result = notesSchema.safeParse('');
        expect(result.success).toBe(true);
      });

      it('should reject notes exceeding 5000 characters', () => {
        const longText = 'a'.repeat(5001);
        const result = notesSchema.safeParse(longText);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Error Formatters', () => {
    // Create a test schema for error formatting
    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      age: z.number().min(0, 'Age must be non-negative').max(150, 'Age is too high'),
    });

    describe('formatZodError', () => {
      it('should format single error', () => {
        const result = testSchema.safeParse({ name: '', email: 'test@example.com', age: 25 });
        if (!result.success) {
          const errors = formatZodError(result.error);
          expect(errors.length).toBe(1);
          expect(errors[0].field).toBe('name');
          expect(errors[0].message).toBe('Name is required');
        }
      });

      it('should format multiple errors', () => {
        const result = testSchema.safeParse({ name: '', email: 'invalid', age: -5 });
        if (!result.success) {
          const errors = formatZodError(result.error);
          expect(errors.length).toBe(3);
          expect(errors.map(e => e.field)).toContain('name');
          expect(errors.map(e => e.field)).toContain('email');
          expect(errors.map(e => e.field)).toContain('age');
        }
      });

      it('should handle nested paths', () => {
        const nestedSchema = z.object({
          user: z.object({
            profile: z.object({
              name: z.string().min(1, 'Name required'),
            }),
          }),
        });
        const result = nestedSchema.safeParse({ user: { profile: { name: '' } } });
        if (!result.success) {
          const errors = formatZodError(result.error);
          expect(errors[0].field).toBe('user.profile.name');
        }
      });
    });

    describe('formatZodErrorAsString', () => {
      it('should format errors as semicolon-separated string', () => {
        const result = testSchema.safeParse({ name: '', email: 'invalid', age: 25 });
        if (!result.success) {
          const errorString = formatZodErrorAsString(result.error);
          expect(errorString).toContain('name: Name is required');
          expect(errorString).toContain('email: Invalid email');
        }
      });

      it('should handle single error', () => {
        const result = testSchema.safeParse({ name: 'John', email: 'invalid', age: 25 });
        if (!result.success) {
          const errorString = formatZodErrorAsString(result.error);
          expect(errorString).toBe('email: Invalid email');
        }
      });
    });

    describe('getFirstZodError', () => {
      it('should return first error with field name', () => {
        const result = testSchema.safeParse({ name: '', email: 'test@example.com', age: 25 });
        if (!result.success) {
          const firstError = getFirstZodError(result.error);
          expect(firstError).toBe('name: Name is required');
        }
      });

      it('should return first of multiple errors with field name', () => {
        const result = testSchema.safeParse({ name: '', email: 'invalid', age: -5 });
        if (!result.success) {
          const firstError = getFirstZodError(result.error);
          // Should be one of the error messages (with field name prefix)
          expect(['name: Name is required', 'email: Invalid email', 'age: Age must be non-negative']).toContain(firstError);
        }
      });
    });
  });
});
