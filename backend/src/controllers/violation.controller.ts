import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { violationService } from '../services/violation.service';

/**
 * Log Violation Controller
 * POST /api/violations/log
 */
export const logViolation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId, violationType, description, severity, browserInfo, deviceInfo, additionalData } = req.body;

    const result = await violationService.logViolation({
      sessionId,
      violationType,
      description,
      severity,
      browserInfo,
      deviceInfo,
      additionalData,
    });

    res.json({
      success: true,
      message: 'Violation logged successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Session Violations Controller
 * GET /api/violations/session/:sessionId
 */
export const getSessionViolations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const violations = await violationService.getSessionViolations(sessionId);

    res.json({
      success: true,
      message: 'Session violations retrieved successfully',
      data: {
        violations,
        count: violations.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Violation Statistics Controller
 * GET /api/violations/stats/:sessionId
 */
export const getViolationStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const violations = await violationService.getSessionViolations(sessionId);

    // Calculate statistics
    const stats = {
      total: violations.length,
      bySeverity: {
        low: violations.filter((v) => v.severity === 'low').length,
        medium: violations.filter((v) => v.severity === 'medium').length,
        high: violations.filter((v) => v.severity === 'high').length,
        critical: violations.filter((v) => v.severity === 'critical').length,
      },
      byType: violations.reduce((acc: Record<string, number>, v) => {
        acc[v.violation_type] = (acc[v.violation_type] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json({
      success: true,
      message: 'Violation statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
