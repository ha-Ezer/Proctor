import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Student Login Controller
 * POST /api/auth/student/login
 */
export declare const studentLogin: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Admin Login Controller
 * POST /api/auth/admin/login
 */
export declare const adminLogin: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Verify Token Controller
 * GET /api/auth/verify
 */
export declare const verifyToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Complete Student Profile Controller
 * POST /api/auth/student/complete-profile
 * Requires authentication
 */
export declare const completeProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.controller.d.ts.map