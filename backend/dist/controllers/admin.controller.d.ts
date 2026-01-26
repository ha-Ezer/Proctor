import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Get All Sessions Controller
 * GET /api/admin/sessions
 */
export declare const getSessions: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Session Details Controller
 * GET /api/admin/sessions/:sessionId/details
 */
export declare const getSessionDetails: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Dashboard Stats Controller
 * GET /api/admin/dashboard/stats
 */
export declare const getDashboardStats: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Export Sessions Controller
 * GET /api/admin/sessions/export
 */
export declare const exportSessions: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Authorized Students Controller
 * GET /api/admin/students
 */
export declare const getAuthorizedStudents: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Add Authorized Student Controller
 * POST /api/admin/students/add
 */
export declare const addAuthorizedStudent: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Remove Authorized Student Controller
 * POST /api/admin/students/remove
 */
export declare const removeAuthorizedStudent: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Bulk Add Students Controller
 * POST /api/admin/students/bulk
 */
export declare const bulkAddStudents: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get All Exams Controller
 * GET /api/admin/exams
 */
export declare const getExams: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Exam By ID Controller
 * GET /api/admin/exams/:examId
 */
export declare const getExamById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Create Exam Controller
 * POST /api/admin/exams/create
 */
export declare const createExam: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Update Exam Controller
 * PATCH /api/admin/exams/:examId
 */
export declare const updateExam: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Add Question Controller
 * POST /api/admin/questions/add
 */
export declare const addQuestion: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Exam Questions Controller
 * GET /api/admin/exams/:examId/questions
 */
export declare const getExamQuestions: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Set Exam Active Controller
 * POST /api/admin/exams/:examId/activate
 */
export declare const setExamActive: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteExamQuestions: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete Exam Controller
 * DELETE /api/admin/exams/:examId
 */
export declare const deleteExam: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Exam Report Controller
 * GET /api/admin/exams/:examId/report
 */
export declare const getExamReport: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Save Exam Report Cell Color Controller
 * POST /api/admin/exams/:examId/report/colors
 */
export declare const saveExamReportCellColor: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Exam Report Cell Colors Controller
 * GET /api/admin/exams/:examId/report/colors
 */
export declare const getExamReportCellColors: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete Exam Report Cell Color Controller
 * DELETE /api/admin/exams/:examId/report/colors
 */
export declare const deleteExamReportCellColor: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Save Session Question Note Controller
 * POST /api/admin/sessions/:sessionId/notes
 */
export declare const saveSessionQuestionNote: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete Session Question Note Controller
 * DELETE /api/admin/sessions/:sessionId/notes
 */
export declare const deleteSessionQuestionNote: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map