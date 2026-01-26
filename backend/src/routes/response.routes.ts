import { Router } from 'express';
import * as responseController from '../controllers/response.controller';
import { validateBody } from '../middleware/validate.middleware';
import { authenticateToken, requireStudent } from '../middleware/auth.middleware';
import { responseLimiter } from '../middleware/rateLimit.middleware';
import { saveResponseSchema } from '../validators/session.validator';
import { z } from 'zod';

const router = Router();

// Bulk save schema
const bulkSaveSchema = z.object({
  sessionId: z.string().uuid(),
  responses: z.array(
    z.object({
      questionId: z.string().uuid(),
      responseText: z.string().optional(),
      responseOptionIndex: z.number().int().min(0).optional(),
    })
  ),
});

/**
 * @route   POST /api/responses/save
 * @desc    Save a single response (auto-save)
 * @access  Protected (Student)
 */
router.post(
  '/save',
  authenticateToken,
  requireStudent,
  responseLimiter,
  validateBody(saveResponseSchema),
  responseController.saveResponse
);

/**
 * @route   POST /api/responses/bulk
 * @desc    Save multiple responses at once
 * @access  Protected (Student)
 */
router.post('/bulk', authenticateToken, requireStudent, validateBody(bulkSaveSchema), responseController.bulkSaveResponses);

/**
 * @route   GET /api/responses/session/:sessionId
 * @desc    Get all responses for a session
 * @access  Protected (Student/Admin)
 */
router.get('/session/:sessionId', authenticateToken, responseController.getSessionResponses);

export default router;
