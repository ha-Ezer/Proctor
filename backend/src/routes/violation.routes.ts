import { Router } from 'express';
import * as violationController from '../controllers/violation.controller';
import { validateBody } from '../middleware/validate.middleware';
import { authenticateToken, requireStudent } from '../middleware/auth.middleware';
import { violationLimiter } from '../middleware/rateLimit.middleware';
import { logViolationSchema } from '../validators/session.validator';

const router = Router();

/**
 * @route   POST /api/violations/log
 * @desc    Log a proctoring violation
 * @access  Protected (Student)
 */
router.post(
  '/log',
  authenticateToken,
  requireStudent,
  violationLimiter,
  validateBody(logViolationSchema),
  violationController.logViolation
);

/**
 * @route   GET /api/violations/session/:sessionId
 * @desc    Get all violations for a session
 * @access  Protected (Student/Admin)
 */
router.get('/session/:sessionId', authenticateToken, violationController.getSessionViolations);

/**
 * @route   GET /api/violations/stats/:sessionId
 * @desc    Get violation statistics for a session
 * @access  Protected (Student/Admin)
 */
router.get('/stats/:sessionId', authenticateToken, violationController.getViolationStats);

export default router;
