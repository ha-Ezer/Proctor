import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Save Response Controller
 * POST /api/responses/save
 * Used for auto-save and manual answer submission
 */
export declare const saveResponse: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Session Responses Controller
 * GET /api/responses/session/:sessionId
 */
export declare const getSessionResponses: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Bulk Save Responses Controller
 * POST /api/responses/bulk
 * Save multiple responses at once (useful for final submission)
 */
export declare const bulkSaveResponses: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=response.controller.d.ts.map