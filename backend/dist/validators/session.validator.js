"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitExamSchema = exports.saveSnapshotSchema = exports.logViolationSchema = exports.saveResponseSchema = exports.startSessionSchema = void 0;
const zod_1 = require("zod");
/**
 * Start Session Validation Schema
 */
exports.startSessionSchema = zod_1.z.object({
    examId: zod_1.z.string().uuid('Invalid exam ID format'),
    browserInfo: zod_1.z.string().optional(),
    ipAddress: zod_1.z.string().optional(),
});
/**
 * Save Response Validation Schema
 */
exports.saveResponseSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid('Invalid session ID format'),
    questionId: zod_1.z.string().uuid('Invalid question ID format'),
    responseText: zod_1.z.string().optional(),
    responseOptionIndex: zod_1.z.number().int().min(0).optional(),
});
/**
 * Log Violation Validation Schema
 */
exports.logViolationSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid('Invalid session ID format'),
    violationType: zod_1.z.string().min(1, 'Violation type is required'),
    description: zod_1.z.string().optional(),
    severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']).optional(),
    browserInfo: zod_1.z.string().optional(),
    deviceInfo: zod_1.z.string().optional(),
    additionalData: zod_1.z.record(zod_1.z.any()).optional(),
});
/**
 * Save Snapshot Validation Schema
 */
exports.saveSnapshotSchema = zod_1.z.object({
    responses: zod_1.z.record(zod_1.z.any()).optional(),
    violations: zod_1.z.number().int().min(0).optional(),
    completionPercentage: zod_1.z.number().min(0).max(100).optional(),
    currentQuestionIndex: zod_1.z.number().int().min(0).optional(),
    timeRemaining: zod_1.z.number().int().min(0).optional(),
});
/**
 * Submit Exam Validation Schema
 */
exports.submitExamSchema = zod_1.z.object({
    submissionType: zod_1.z.enum(['manual', 'auto_time_expired', 'auto_violations']),
});
//# sourceMappingURL=session.validator.js.map