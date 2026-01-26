"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLoginSchema = exports.studentLoginSchema = void 0;
const zod_1 = require("zod");
/**
 * Student Login Validation Schema
 * fullName is now optional - only provided during profile completion
 */
exports.studentLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format').toLowerCase(),
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters').max(255).optional(),
});
/**
 * Admin Login Validation Schema
 */
exports.adminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format').toLowerCase(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
//# sourceMappingURL=auth.validator.js.map