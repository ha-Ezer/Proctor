import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Log Violation Controller
 * POST /api/violations/log
 */
export declare const logViolation: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Session Violations Controller
 * GET /api/violations/session/:sessionId
 */
export declare const getSessionViolations: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Violation Statistics Controller
 * GET /api/violations/stats/:sessionId
 */
export declare const getViolationStats: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=violation.controller.d.ts.map