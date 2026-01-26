"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getViolationStats = exports.getSessionViolations = exports.logViolation = void 0;
const violation_service_1 = require("../services/violation.service");
/**
 * Log Violation Controller
 * POST /api/violations/log
 */
const logViolation = async (req, res, next) => {
    try {
        const { sessionId, violationType, description, severity, browserInfo, deviceInfo, additionalData } = req.body;
        const result = await violation_service_1.violationService.logViolation({
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
    }
    catch (error) {
        next(error);
    }
};
exports.logViolation = logViolation;
/**
 * Get Session Violations Controller
 * GET /api/violations/session/:sessionId
 */
const getSessionViolations = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const violations = await violation_service_1.violationService.getSessionViolations(sessionId);
        res.json({
            success: true,
            message: 'Session violations retrieved successfully',
            data: {
                violations,
                count: violations.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSessionViolations = getSessionViolations;
/**
 * Get Violation Statistics Controller
 * GET /api/violations/stats/:sessionId
 */
const getViolationStats = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const violations = await violation_service_1.violationService.getSessionViolations(sessionId);
        // Calculate statistics
        const stats = {
            total: violations.length,
            bySeverity: {
                low: violations.filter((v) => v.severity === 'low').length,
                medium: violations.filter((v) => v.severity === 'medium').length,
                high: violations.filter((v) => v.severity === 'high').length,
                critical: violations.filter((v) => v.severity === 'critical').length,
            },
            byType: violations.reduce((acc, v) => {
                acc[v.violation_type] = (acc[v.violation_type] || 0) + 1;
                return acc;
            }, {}),
        };
        res.json({
            success: true,
            message: 'Violation statistics retrieved successfully',
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getViolationStats = getViolationStats;
//# sourceMappingURL=violation.controller.js.map