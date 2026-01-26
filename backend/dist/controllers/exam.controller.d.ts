import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Get Active Exam Controller
 * GET /api/exams/active
 * Returns the currently active exam with all questions
 */
export declare const getActiveExam: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Exam by ID Controller
 * GET /api/exams/:examId
 * Returns a specific exam with all questions (admin only)
 */
export declare const getExamById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=exam.controller.d.ts.map