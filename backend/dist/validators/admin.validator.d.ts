import { z } from 'zod';
/**
 * Add Student Validation Schema
 * fullName is now optional - student provides it on first login
 */
export declare const addStudentSchema: z.ZodObject<{
    email: z.ZodString;
    fullName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    fullName?: string | undefined;
}, {
    email: string;
    fullName?: string | undefined;
}>;
/**
 * Bulk Add Students Validation Schema
 */
export declare const bulkAddStudentsSchema: z.ZodObject<{
    students: z.ZodArray<z.ZodObject<{
        email: z.ZodString;
        fullName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        fullName: string;
    }, {
        email: string;
        fullName: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    students: {
        email: string;
        fullName: string;
    }[];
}, {
    students: {
        email: string;
        fullName: string;
    }[];
}>;
/**
 * Create Exam Validation Schema
 */
export declare const createExamSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    version: z.ZodString;
    durationMinutes: z.ZodNumber;
    maxViolations: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    version: string;
    durationMinutes: number;
    description?: string | undefined;
    maxViolations?: number | undefined;
}, {
    title: string;
    version: string;
    durationMinutes: number;
    description?: string | undefined;
    maxViolations?: number | undefined;
}>;
/**
 * Add Question Validation Schema
 */
export declare const addQuestionSchema: z.ZodObject<{
    examId: z.ZodString;
    questionNumber: z.ZodNumber;
    questionText: z.ZodString;
    questionType: z.ZodEnum<["multiple-choice", "text", "textarea"]>;
    required: z.ZodOptional<z.ZodBoolean>;
    placeholder: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, string, string | undefined>, string, string | undefined>;
    options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    correctAnswer: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    examId: string;
    questionNumber: number;
    questionText: string;
    questionType: "multiple-choice" | "text" | "textarea";
    imageUrl: string;
    options?: string[] | undefined;
    correctAnswer?: number | undefined;
    required?: boolean | undefined;
    placeholder?: string | undefined;
}, {
    examId: string;
    questionNumber: number;
    questionText: string;
    questionType: "multiple-choice" | "text" | "textarea";
    options?: string[] | undefined;
    correctAnswer?: number | undefined;
    imageUrl?: string | undefined;
    required?: boolean | undefined;
    placeholder?: string | undefined;
}>;
/**
 * Set Exam Active Validation Schema
 */
export declare const setExamActiveSchema: z.ZodObject<{
    examId: z.ZodString;
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    examId: string;
    isActive: boolean;
}, {
    examId: string;
    isActive: boolean;
}>;
/**
 * Session Filters Validation Schema
 */
export declare const sessionFiltersSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["in_progress", "completed", "terminated", "expired", "all"]>>;
    examId: z.ZodOptional<z.ZodString>;
    studentEmail: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodEnum<["start_time", "status", "violations", "score"]>>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    status?: "in_progress" | "completed" | "terminated" | "expired" | "all" | undefined;
    examId?: string | undefined;
    studentEmail?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    page?: number | undefined;
    sortBy?: "status" | "violations" | "start_time" | "score" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}, {
    limit?: number | undefined;
    status?: "in_progress" | "completed" | "terminated" | "expired" | "all" | undefined;
    examId?: string | undefined;
    studentEmail?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    page?: number | undefined;
    sortBy?: "status" | "violations" | "start_time" | "score" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type AddStudentInput = z.infer<typeof addStudentSchema>;
export type BulkAddStudentsInput = z.infer<typeof bulkAddStudentsSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type AddQuestionInput = z.infer<typeof addQuestionSchema>;
export type SetExamActiveInput = z.infer<typeof setExamActiveSchema>;
export type SessionFiltersInput = z.infer<typeof sessionFiltersSchema>;
//# sourceMappingURL=admin.validator.d.ts.map