import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { sessionService } from '../services/session.service';

/**
 * Start Session Controller
 * POST /api/sessions/start
 */
export const startSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId, browserInfo, ipAddress } = req.body;
    const studentId = req.user!.id;

    const session = await sessionService.createSession({
      studentId,
      examId,
      browserInfo,
      ipAddress,
    });

    res.status(201).json({
      success: true,
      message: 'Exam session started successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Session Controller
 * GET /api/sessions/:sessionId
 */
export const getSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const session = await sessionService.getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
        code: 'SESSION_NOT_FOUND',
      });
    }

    // Verify student owns this session (unless admin)
    if (req.user!.type === 'student' && session.student_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this session',
        code: 'ACCESS_DENIED',
      });
    }

    res.json({
      success: true,
      message: 'Session retrieved successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check for Existing Session Controller
 * GET /api/sessions/check/:examId
 */
export const checkExistingSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const studentId = req.user!.id;

    const session = await sessionService.checkExistingSession(studentId, examId);

    res.json({
      success: true,
      message: session ? 'Existing session found' : 'No existing session',
      data: {
        hasExistingSession: !!session,
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Recovery Data Controller
 * GET /api/sessions/:sessionId/recovery
 */
export const getRecoveryData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const recoveryData = await sessionService.getRecoveryData(sessionId);

    if (!recoveryData) {
      return res.status(404).json({
        success: false,
        message: 'No recovery data found',
        code: 'NO_RECOVERY_DATA',
      });
    }

    res.json({
      success: true,
      message: 'Recovery data retrieved successfully',
      data: recoveryData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save Snapshot Controller
 * POST /api/sessions/:sessionId/snapshot
 */
export const saveSnapshot = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const snapshotData = req.body;

    const snapshot = await sessionService.saveSnapshot(sessionId, snapshotData);

    res.json({
      success: true,
      message: 'Progress snapshot saved successfully',
      data: snapshot,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete Session Controller
 * POST /api/sessions/:sessionId/submit
 */
export const completeSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { submissionType } = req.body;

    const result = await sessionService.completeSession(sessionId, submissionType);

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
