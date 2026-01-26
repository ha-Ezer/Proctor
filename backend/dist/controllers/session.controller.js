"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeSession = exports.saveSnapshot = exports.getRecoveryData = exports.checkExistingSession = exports.getSession = exports.startSession = void 0;
const session_service_1 = require("../services/session.service");
/**
 * Start Session Controller
 * POST /api/sessions/start
 */
const startSession = async (req, res, next) => {
    try {
        const { examId, browserInfo, ipAddress } = req.body;
        const studentId = req.user.id;
        const session = await session_service_1.sessionService.createSession({
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
    }
    catch (error) {
        next(error);
    }
};
exports.startSession = startSession;
/**
 * Get Session Controller
 * GET /api/sessions/:sessionId
 */
const getSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const session = await session_service_1.sessionService.getSessionById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
                code: 'SESSION_NOT_FOUND',
            });
        }
        // Verify student owns this session (unless admin)
        if (req.user.type === 'student' && session.student_id !== req.user.id) {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getSession = getSession;
/**
 * Check for Existing Session Controller
 * GET /api/sessions/check/:examId
 */
const checkExistingSession = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const studentId = req.user.id;
        const session = await session_service_1.sessionService.checkExistingSession(studentId, examId);
        res.json({
            success: true,
            message: session ? 'Existing session found' : 'No existing session',
            data: {
                hasExistingSession: !!session,
                session,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.checkExistingSession = checkExistingSession;
/**
 * Get Recovery Data Controller
 * GET /api/sessions/:sessionId/recovery
 */
const getRecoveryData = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const recoveryData = await session_service_1.sessionService.getRecoveryData(sessionId);
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
    }
    catch (error) {
        next(error);
    }
};
exports.getRecoveryData = getRecoveryData;
/**
 * Save Snapshot Controller
 * POST /api/sessions/:sessionId/snapshot
 */
const saveSnapshot = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const snapshotData = req.body;
        const snapshot = await session_service_1.sessionService.saveSnapshot(sessionId, snapshotData);
        res.json({
            success: true,
            message: 'Progress snapshot saved successfully',
            data: snapshot,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.saveSnapshot = saveSnapshot;
/**
 * Complete Session Controller
 * POST /api/sessions/:sessionId/submit
 */
const completeSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { submissionType } = req.body;
        const result = await session_service_1.sessionService.completeSession(sessionId, submissionType);
        res.json({
            success: true,
            message: 'Exam submitted successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.completeSession = completeSession;
//# sourceMappingURL=session.controller.js.map