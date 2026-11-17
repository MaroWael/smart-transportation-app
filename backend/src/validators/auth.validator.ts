// ---------------------------------------------------------------
// Smart Transportation — Auth validators
// ---------------------------------------------------------------
// Zod schemas for /api/auth request validation.
// ---------------------------------------------------------------

import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'fullName must be at least 2 characters')
      .max(100, 'fullName must be at most 100 characters'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
  })
  .strip();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export const updateMeSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'fullName must be at least 2 characters')
      .max(100, 'fullName must be at most 100 characters'),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
