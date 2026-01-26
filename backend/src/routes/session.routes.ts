import { Router } from 'express';
import * as sessionController from '../controllers/session.controller';
import { validateBody } from '../middleware/validate.middleware';
import { authenticateToken, requireStudent } from '../middleware/auth.middleware';
import { startSessionSchema, saveSnapshotSchema, submitExamSchema } from '../validators/session.validator';
import { z } from 'zod';

const router = Router();

// UUID validation schema for params
const uuidParamSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
});

const examIdParamSchema = z.object({
  examId: z.string().uuid('Invalid exam ID'),
});

/**
 * @route   POST /api/sessions/start
 * @desc    Start a new exam session
 * @access  Protected (Student)
 */
router.post('/start', authenticateToken, requireStudent, validateBody(startSessionSchema), sessionController.startSession);

/**
 * @route   GET /api/sessions/check/:examId
 * @desc    Check for existing session for this exam
 * @access  Protected (Student)
 */
router.get('/check/:examId', authenticateToken, requireStudent, sessionController.checkExistingSession);

/**
 * @route   GET /api/sessions/:sessionId
 * @desc    Get session details
 * @access  Protected (Student owns session)
 */
router.get('/:sessionId', authenticateToken, sessionController.getSession);

/**
 * @route   GET /api/sessions/:sessionId/recovery
 * @desc    Get recovery data for session
 * @access  Protected (Student)
 */
router.get('/:sessionId/recovery', authenticateToken, requireStudent, sessionController.getRecoveryData);

/**
 * @route   POST /api/sessions/:sessionId/snapshot
 * @desc    Save progress snapshot (auto-save)
 * @access  Protected (Student)
 */
router.post(
  '/:sessionId/snapshot',
  authenticateToken,
  requireStudent,
  validateBody(saveSnapshotSchema),
  sessionController.saveSnapshot
);

/**
 * @route   POST /api/sessions/:sessionId/submit
 * @desc    Submit exam (complete session)
 * @access  Protected (Student)
 */
router.post(
  '/:sessionId/submit',
  authenticateToken,
  requireStudent,
  validateBody(submitExamSchema),
  sessionController.completeSession
);

export default router;
