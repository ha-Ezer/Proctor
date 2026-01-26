import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';
import { studentLoginSchema, adminLoginSchema } from '../validators/auth.validator';

const router = Router();

/**
 * @route   POST /api/auth/student/login
 * @desc    Student login with email
 * @access  Public
 */
router.post('/student/login', authLimiter, validateBody(studentLoginSchema), authController.studentLogin);

/**
 * @route   POST /api/auth/admin/login
 * @desc    Admin login with email and password
 * @access  Public
 */
router.post('/admin/login', authLimiter, validateBody(adminLoginSchema), authController.adminLogin);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token validity
 * @access  Protected
 */
router.get('/verify', authenticateToken, authController.verifyToken);

/**
 * @route   POST /api/auth/student/complete-profile
 * @desc    Complete student profile (add full name on first login)
 * @access  Protected (student only)
 */
router.post('/student/complete-profile', authenticateToken, authController.completeProfile);

export default router;
