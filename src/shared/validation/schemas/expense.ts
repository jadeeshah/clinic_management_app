/**
 * Expense validation schemas
 */

import { z } from 'zod';
import {
  dateStringSchema,
  positiveNumberSchema,
  optionalTextSchema,
  notesSchema,
  idSchema,
} from '../helpers/validators';

// Expense category enum matching database CHECK constraint
export const expenseCategoryEnum = z.enum([
  'Rent',
  'Utilities',
  'Supplies',
  'Salary',
  'Equipment',
  'Other',
]);

/**
 * Schema for creating a new expense
 */
export const createExpenseSchema = z.object({
  expenseDate: dateStringSchema,
  title: z
    .string()
    .min(1, 'Expense title is required')
    .max(200, 'Title must be 200 characters or less'),
  category: expenseCategoryEnum.default('Other'),
  amount: positiveNumberSchema,
  paidTo: optionalTextSchema(200),
  notes: notesSchema,
});

/**
 * Schema for updating an existing expense
 */
export const updateExpenseSchema = createExpenseSchema.extend({
  expenseID: idSchema,
});

/**
 * Schema for querying expenses
 */
export const getExpensesSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: expenseCategoryEnum.optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Type exports
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type GetExpensesInput = z.infer<typeof getExpensesSchema>;
