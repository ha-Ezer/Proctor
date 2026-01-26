import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';

/**
 * Student Login Controller
 * POST /api/auth/student/login
 */
export const studentLogin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, fullName } = req.body;

    const result = await authService.authenticateStudent({ email, fullName });

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Login Controller
 * POST /api/auth/admin/login
 */
export const adminLogin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const result = await authService.authenticateAdmin({ email, password });

    res.json({
      success: true,
      message: 'Admin login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Token Controller
 * GET /api/auth/verify
 */
export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // User is already attached by authenticateToken middleware
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete Student Profile Controller
 * POST /api/auth/student/complete-profile
 * Requires authentication
 */
export const completeProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fullName } = req.body;
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!fullName || fullName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required',
      });
    }

    const result = await authService.completeStudentProfile(studentId, fullName.trim());

    res.json({
      success: true,
      message: 'Profile completed successfully',
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'PROFILE_ALREADY_COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Profile has already been completed',
      });
    }
    next(error);
  }
};
