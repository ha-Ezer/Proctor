"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionFiltersSchema = exports.setExamActiveSchema = exports.addQuestionSchema = exports.createExamSchema = exports.bulkAddStudentsSchema = exports.addStudentSchema = void 0;
const zod_1 = require("zod");
/**
 * Add Student Validation Schema
 * fullName is now optional - student provides it on first login
 */
exports.addStudentSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format').toLowerCase(),
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters').max(255).optional(),
});
/**
 * Bulk Add Students Validation Schema
 */
exports.bulkAddStudentsSchema = zod_1.z.object({
    students: zod_1.z
        .array(zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format').toLowerCase(),
        fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters').max(255),
    }))
        .min(1, 'At least one student is required')
        .max(1000, 'Cannot add more than 1000 students at once'),
});
/**
 * Create Exam Validation Schema
 */
exports.createExamSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters').max(255),
    description: zod_1.z.string().optional(),
    version: zod_1.z.string().min(1, 'Version is required').max(50),
    durationMinutes: zod_1.z.number().int().min(1).max(480), // Max 8 hours
    maxViolations: zod_1.z.number().int().min(1).max(50).optional(),
});
/**
 * Add Question Validation Schema
 */
exports.addQuestionSchema = zod_1.z.object({
    examId: zod_1.z.string().uuid('Invalid exam ID format'),
    questionNumber: zod_1.z.coerce.number().int().min(1),
    questionText: zod_1.z.string().min(1, 'Question text is required'),
    questionType: zod_1.z.enum(['multiple-choice', 'text', 'textarea']),
    required: zod_1.z.boolean().optional(),
    placeholder: zod_1.z.string().optional(),
    // Allow full URLs, relative URLs (starting with /), attachments/images paths, or empty string
    imageUrl: zod_1.z
        .string()
        .optional()
        .transform((val) => {
        if (!val || typeof val !== 'string')
            return '';
        const v = val.trim();
        if (!v)
            return '';
        // Normalize to path starting with / or full URL
        if (v.startsWith('attachments/'))
            return v.replace('attachments/', '/images/');
        if (v.startsWith('images/') && !v.startsWith('/'))
            return '/' + v;
        return v;
    })
        .refine((val) => val === '' ||
        val.startsWith('/') ||
        val.startsWith('http://') ||
        val.startsWith('https://'), { message: 'Image URL must be a valid URL, path starting with /, or attachments/images path' }),
    options: zod_1.z.array(zod_1.z.string()).max(10).optional(),
    correctAnswer: zod_1.z.coerce.number().int().min(0).optional(),
});
/**
 * Set Exam Active Validation Schema
 */
exports.setExamActiveSchema = zod_1.z.object({
    examId: zod_1.z.string().uuid('Invalid exam ID format'),
    isActive: zod_1.z.boolean(),
});
/**
 * Session Filters Validation Schema
 */
exports.sessionFiltersSchema = zod_1.z.object({
    status: zod_1.z.enum(['in_progress', 'completed', 'terminated', 'expired', 'all']).optional(),
    examId: zod_1.z.string().uuid().optional(),
    studentEmail: zod_1.z.string().email().optional(),
    startDate: zod_1.z.string().optional(), // ISO date string
    endDate: zod_1.z.string().optional(), // ISO date string
    page: zod_1.z.number().int().min(1).optional(),
    limit: zod_1.z.number().int().min(1).max(1000).optional(),
    sortBy: zod_1.z.enum(['start_time', 'status', 'violations', 'score']).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
//# sourceMappingURL=admin.validator.js.map