import { z } from 'zod';

/**
 * Add Student Validation Schema
 * fullName is now optional - student provides it on first login
 */
export const addStudentSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(255).optional(),
});

/**
 * Bulk Add Students Validation Schema
 */
export const bulkAddStudentsSchema = z.object({
  students: z
    .array(
      z.object({
        email: z.string().email('Invalid email format').toLowerCase(),
        fullName: z.string().min(2, 'Full name must be at least 2 characters').max(255),
      })
    )
    .min(1, 'At least one student is required')
    .max(1000, 'Cannot add more than 1000 students at once'),
});

/**
 * Create Exam Validation Schema
 */
export const createExamSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional(),
  version: z.string().min(1, 'Version is required').max(50),
  durationMinutes: z.number().int().min(1).max(480), // Max 8 hours
  maxViolations: z.number().int().min(1).max(50).optional(),
});

/**
 * Add Question Validation Schema
 */
export const addQuestionSchema = z.object({
  examId: z.string().uuid('Invalid exam ID format'),
  questionNumber: z.number().int().min(1),
  questionText: z.string().min(1, 'Question text is required'),
  questionType: z.enum(['multiple-choice', 'text', 'textarea']),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  // Allow full URLs, relative URLs (starting with /), attachments paths, or empty string
  imageUrl: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return '';
      // Convert attachments/filename to /images/filename
      if (val.startsWith('attachments/')) {
        return val.replace('attachments/', '/images/');
      }
      return val;
    })
    .refine(
      (val) => val === '' || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
      { message: 'Image URL must be a valid URL, relative path starting with /, or attachments/filename format' }
    ),
  options: z.array(z.string()).min(2).max(10).optional(),
  correctAnswer: z.number().int().min(0).optional(),
});

/**
 * Set Exam Active Validation Schema
 */
export const setExamActiveSchema = z.object({
  examId: z.string().uuid('Invalid exam ID format'),
  isActive: z.boolean(),
});

/**
 * Session Filters Validation Schema
 */
export const sessionFiltersSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'terminated', 'expired', 'all']).optional(),
  examId: z.string().uuid().optional(),
  studentEmail: z.string().email().optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  sortBy: z.enum(['start_time', 'status', 'violations', 'score']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type AddStudentInput = z.infer<typeof addStudentSchema>;
export type BulkAddStudentsInput = z.infer<typeof bulkAddStudentsSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type AddQuestionInput = z.infer<typeof addQuestionSchema>;
export type SetExamActiveInput = z.infer<typeof setExamActiveSchema>;
export type SessionFiltersInput = z.infer<typeof sessionFiltersSchema>;
