/**
 * User/Authentication validation schemas
 */

import { z } from 'zod';
import { idSchema } from '../helpers/validators';

// User role enum matching database CHECK constraint
export const userRoleEnum = z.enum(['Admin', 'User']);

/**
 * Schema for user login
 */
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(50, 'Username must be 50 characters or less'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100, 'Password must be 100 characters or less'),
});

/**
 * Schema for creating a new user
 */
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be 50 characters or less')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be 100 characters or less'),
  role: userRoleEnum.default('User'),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating a user (without password)
 */
export const updateUserSchema = z.object({
  userID: idSchema,
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be 50 characters or less')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  role: userRoleEnum,
  isActive: z.boolean(),
});

/**
 * Schema for changing password
 */
export const changePasswordSchema = z.object({
  userID: idSchema,
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(100, 'Password must be 100 characters or less'),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
