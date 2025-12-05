/**
 * Invoice and Payment validation schemas
 */

import { z } from 'zod';
import {
  dateStringSchema,
  optionalDateStringSchema,
  optionalTimeStringSchema,
  idSchema,
  optionalIdSchema,
  nonNegativeNumberSchema,
  positiveNumberSchema,
  optionalTextSchema,
  notesSchema,
} from '../helpers/validators';

// Invoice status enum matching database CHECK constraint
export const invoiceStatusEnum = z.enum([
  'Unpaid',
  'PartiallyPaid',
  'Paid',
  'Void',
]);

// Payment method enum matching database CHECK constraint
export const paymentMethodEnum = z.enum([
  'Cash',
  'Card',
  'BankTransfer',
]);

/**
 * Schema for invoice line items
 */
export const invoiceItemSchema = z.object({
  serviceID: optionalIdSchema,
  description: z
    .string()
    .min(1, 'Item description is required')
    .max(500, 'Description must be 500 characters or less'),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .default(1),
  unitPrice: nonNegativeNumberSchema.default(0),
  lineTotal: nonNegativeNumberSchema,
});

/**
 * Schema for creating a new invoice
 */
export const createInvoiceSchema = z
  .object({
    patientID: idSchema,
    doctorID: optionalIdSchema,
    visitID: optionalIdSchema,
    invoiceDate: dateStringSchema,
    items: z
      .array(invoiceItemSchema)
      .min(1, 'At least one item is required'),
    discountAmount: nonNegativeNumberSchema.default(0),
    taxAmount: nonNegativeNumberSchema.default(0),
    nextVisitDate: optionalDateStringSchema,
    nextVisitTime: optionalTimeStringSchema,
  })
  .refine(
    (data) => {
      // Validate at least one item has a positive total
      return data.items.some((item) => item.lineTotal > 0);
    },
    {
      message: 'At least one item must have a total greater than 0',
      path: ['items'],
    }
  );

/**
 * Schema for updating invoice status (void)
 */
export const updateInvoiceStatusSchema = z.object({
  invoiceID: idSchema,
  status: invoiceStatusEnum,
});

/**
 * Schema for creating a payment
 */
export const createPaymentSchema = z.object({
  invoiceID: idSchema,
  paymentDate: dateStringSchema,
  amount: positiveNumberSchema,
  method: paymentMethodEnum.default('Cash'),
  transactionID: optionalTextSchema(100),
  notes: notesSchema,
});

/**
 * Schema for querying invoices
 */
export const getInvoicesSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: invoiceStatusEnum.optional(),
  patientID: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Type exports
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type GetInvoicesInput = z.infer<typeof getInvoicesSchema>;
