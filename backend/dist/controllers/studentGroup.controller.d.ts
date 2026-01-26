import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Get All Groups
 * GET /api/admin/groups
 */
export declare const getGroups: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Group By ID
 * GET /api/admin/groups/:groupId
 */
export declare const getGroupById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Create Group
 * POST /api/admin/groups
 */
export declare const createGroup: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Update Group
 * PATCH /api/admin/groups/:groupId
 */
export declare const updateGroup: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete Group
 * DELETE /api/admin/groups/:groupId
 */
export declare const deleteGroup: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Group Members
 * GET /api/admin/groups/:groupId/members
 */
export declare const getGroupMembers: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Add Student to Group
 * POST /api/admin/groups/:groupId/members
 */
export declare const addStudentToGroup: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Add Multiple Students to Group by Email
 * POST /api/admin/groups/:groupId/members/bulk
 */
export declare const addStudentsByEmail: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Remove Student from Group
 * DELETE /api/admin/groups/:groupId/members/:studentId
 */
export declare const removeStudentFromGroup: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Student's Groups
 * GET /api/admin/students/:studentId/groups
 */
export declare const getStudentGroups: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Assign Group to Exam
 * POST /api/admin/exams/:examId/groups
 */
export declare const assignGroupToExam: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Remove Group from Exam
 * DELETE /api/admin/exams/:examId/groups/:groupId
 */
export declare const removeGroupFromExam: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get Exam Groups
 * GET /api/admin/exams/:examId/groups
 */
export declare const getExamGroups: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=studentGroup.controller.d.ts.map