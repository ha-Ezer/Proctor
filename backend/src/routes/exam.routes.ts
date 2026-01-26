import { Router } from 'express';
import * as examController from '../controllers/exam.controller';
import { authenticateToken, requireStudent, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/exams/active
 * @desc    Get currently active exam with questions
 * @access  Protected (Student)
 */
router.get('/active', authenticateToken, requireStudent, examController.getActiveExam);

/**
 * @route   GET /api/exams/:examId
 * @desc    Get specific exam by ID
 * @access  Protected (Admin)
 */
router.get('/:examId', authenticateToken, requireAdmin, examController.getExamById);

export default router;
