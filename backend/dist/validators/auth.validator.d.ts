import { z } from 'zod';
/**
 * Student Login Validation Schema
 * fullName is now optional - only provided during profile completion
 */
export declare const studentLoginSchema: z.ZodObject<{
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
 * Admin Login Validation Schema
 */
export declare const adminLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
//# sourceMappingURL=auth.validator.d.ts.map