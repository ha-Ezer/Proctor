import { z } from 'zod';

/**
 * Student Login Validation Schema
 * fullName is now optional - only provided during profile completion
 */
export const studentLoginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(255).optional(),
});

/**
 * Admin Login Validation Schema
 */
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
