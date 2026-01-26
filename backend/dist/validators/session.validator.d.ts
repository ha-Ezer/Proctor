import { z } from 'zod';
/**
 * Start Session Validation Schema
 */
export declare const startSessionSchema: z.ZodObject<{
    examId: z.ZodString;
    browserInfo: z.ZodOptional<z.ZodString>;
    ipAddress: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    examId: string;
    browserInfo?: string | undefined;
    ipAddress?: string | undefined;
}, {
    examId: string;
    browserInfo?: string | undefined;
    ipAddress?: string | undefined;
}>;
/**
 * Save Response Validation Schema
 */
export declare const saveResponseSchema: z.ZodObject<{
    sessionId: z.ZodString;
    questionId: z.ZodString;
    responseText: z.ZodOptional<z.ZodString>;
    responseOptionIndex: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    questionId: string;
    responseText?: string | undefined;
    responseOptionIndex?: number | undefined;
}, {
    sessionId: string;
    questionId: string;
    responseText?: string | undefined;
    responseOptionIndex?: number | undefined;
}>;
/**
 * Log Violation Validation Schema
 */
export declare const logViolationSchema: z.ZodObject<{
    sessionId: z.ZodString;
    violationType: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    severity: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    browserInfo: z.ZodOptional<z.ZodString>;
    deviceInfo: z.ZodOptional<z.ZodString>;
    additionalData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    violationType: string;
    browserInfo?: string | undefined;
    description?: string | undefined;
    severity?: "critical" | "high" | "low" | "medium" | undefined;
    deviceInfo?: string | undefined;
    additionalData?: Record<string, any> | undefined;
}, {
    sessionId: string;
    violationType: string;
    browserInfo?: string | undefined;
    description?: string | undefined;
    severity?: "critical" | "high" | "low" | "medium" | undefined;
    deviceInfo?: string | undefined;
    additionalData?: Record<string, any> | undefined;
}>;
/**
 * Save Snapshot Validation Schema
 */
export declare const saveSnapshotSchema: z.ZodObject<{
    responses: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    violations: z.ZodOptional<z.ZodNumber>;
    completionPercentage: z.ZodOptional<z.ZodNumber>;
    currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
    timeRemaining: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    responses?: Record<string, any> | undefined;
    violations?: number | undefined;
    completionPercentage?: number | undefined;
    currentQuestionIndex?: number | undefined;
    timeRemaining?: number | undefined;
}, {
    responses?: Record<string, any> | undefined;
    violations?: number | undefined;
    completionPercentage?: number | undefined;
    currentQuestionIndex?: number | undefined;
    timeRemaining?: number | undefined;
}>;
/**
 * Submit Exam Validation Schema
 */
export declare const submitExamSchema: z.ZodObject<{
    submissionType: z.ZodEnum<["manual", "auto_time_expired", "auto_violations"]>;
}, "strip", z.ZodTypeAny, {
    submissionType: "manual" | "auto_time_expired" | "auto_violations";
}, {
    submissionType: "manual" | "auto_time_expired" | "auto_violations";
}>;
export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type SaveResponseInput = z.infer<typeof saveResponseSchema>;
export type LogViolationInput = z.infer<typeof logViolationSchema>;
export type SaveSnapshotInput = z.infer<typeof saveSnapshotSchema>;
export type SubmitExamInput = z.infer<typeof submitExamSchema>;
//# sourceMappingURL=session.validator.d.ts.map