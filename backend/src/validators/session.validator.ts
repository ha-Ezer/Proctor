import { z } from 'zod';

/**
 * Start Session Validation Schema
 */
export const startSessionSchema = z.object({
  examId: z.string().uuid('Invalid exam ID format'),
  browserInfo: z.string().optional(),
  ipAddress: z.string().optional(),
});

/**
 * Save Response Validation Schema
 */
export const saveResponseSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
  questionId: z.string().uuid('Invalid question ID format'),
  responseText: z.string().optional(),
  responseOptionIndex: z.number().int().min(0).optional(),
});

/**
 * Log Violation Validation Schema
 */
export const logViolationSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
  violationType: z.string().min(1, 'Violation type is required'),
  description: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  browserInfo: z.string().optional(),
  deviceInfo: z.string().optional(),
  additionalData: z.record(z.any()).optional(),
});

/**
 * Save Snapshot Validation Schema
 */
export const saveSnapshotSchema = z.object({
  responses: z.record(z.any()).optional(),
  violations: z.number().int().min(0).optional(),
  completionPercentage: z.number().min(0).max(100).optional(),
  currentQuestionIndex: z.number().int().min(0).optional(),
  timeRemaining: z.number().int().min(0).optional(),
});

/**
 * Submit Exam Validation Schema
 */
export const submitExamSchema = z.object({
  submissionType: z.enum(['manual', 'auto_time_expired', 'auto_violations']),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type SaveResponseInput = z.infer<typeof saveResponseSchema>;
export type LogViolationInput = z.infer<typeof logViolationSchema>;
export type SaveSnapshotInput = z.infer<typeof saveSnapshotSchema>;
export type SubmitExamInput = z.infer<typeof submitExamSchema>;
