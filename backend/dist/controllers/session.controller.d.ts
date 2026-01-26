import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Start Session Controller
 * POST /api/sessions/start
 */
export declare const startSession: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Session Controller
 * GET /api/sessions/:sessionId
 */
export declare const getSession: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Check for Existing Session Controller
 * GET /api/sessions/check/:examId
 */
export declare const checkExistingSession: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Recovery Data Controller
 * GET /api/sessions/:sessionId/recovery
 */
export declare const getRecoveryData: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Save Snapshot Controller
 * POST /api/sessions/:sessionId/snapshot
 */
export declare const saveSnapshot: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Complete Session Controller
 * POST /api/sessions/:sessionId/submit
 */
export declare const completeSession: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=session.controller.d.ts.map