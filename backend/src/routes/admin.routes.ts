import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import {
  addStudentSchema,
  bulkAddStudentsSchema,
  createExamSchema,
  addQuestionSchema,
  setExamActiveSchema,
  sessionFiltersSchema,
} from '../validators/admin.validator';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

/**
 * Dashboard Statistics
 */
router.get('/dashboard/stats', adminController.getDashboardStats);

/**
 * Session Management
 */
router.get('/sessions', validateQuery(sessionFiltersSchema), adminController.getSessions);
router.get('/sessions/:sessionId/details', adminController.getSessionDetails);
router.post('/sessions/:sessionId/notes', adminController.saveSessionQuestionNote);
router.delete('/sessions/:sessionId/notes', adminController.deleteSessionQuestionNote);
router.get('/sessions/export', validateQuery(sessionFiltersSchema), adminController.exportSessions);

/**
 * Student Management
 */
router.get('/students', adminController.getAuthorizedStudents);
router.post('/students/add', validateBody(addStudentSchema), adminController.addAuthorizedStudent);
router.post('/students/remove', validateBody(addStudentSchema.pick({ email: true })), adminController.removeAuthorizedStudent);
router.post('/students/bulk', validateBody(bulkAddStudentsSchema), adminController.bulkAddStudents);

/**
 * Exam Management
 */
router.get('/exams', adminController.getExams);
router.get('/exams/:examId', adminController.getExamById);
router.post('/exams/create', validateBody(createExamSchema), adminController.createExam);
router.patch('/exams/:examId', adminController.updateExam);
router.post('/exams/:examId/activate', validateBody(setExamActiveSchema.omit({ examId: true })), adminController.setExamActive);
router.delete('/exams/:examId', adminController.deleteExam);

/**
 * Question Management
 */
router.get('/exams/:examId/questions', adminController.getExamQuestions);
router.delete('/exams/:examId/questions', adminController.deleteExamQuestions);
router.post('/questions/add', validateBody(addQuestionSchema), adminController.addQuestion);

/**
 * Exam Report & Cell Colors
 */
router.get('/exams/:examId/report', adminController.getExamReport);
router.get('/exams/:examId/report/colors', adminController.getExamReportCellColors);
router.post('/exams/:examId/report/colors', adminController.saveExamReportCellColor);
router.delete('/exams/:examId/report/colors', adminController.deleteExamReportCellColor);

export default router;
