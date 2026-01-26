"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeProfile = exports.verifyToken = exports.adminLogin = exports.studentLogin = void 0;
const auth_service_1 = require("../services/auth.service");
/**
 * Student Login Controller
 * POST /api/auth/student/login
 */
const studentLogin = async (req, res, next) => {
    try {
        const { email, fullName } = req.body;
        const result = await auth_service_1.authService.authenticateStudent({ email, fullName });
        res.json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.studentLogin = studentLogin;
/**
 * Admin Login Controller
 * POST /api/auth/admin/login
 */
const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await auth_service_1.authService.authenticateAdmin({ email, password });
        res.json({
            success: true,
            message: 'Admin login successful',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.adminLogin = adminLogin;
/**
 * Verify Token Controller
 * GET /api/auth/verify
 */
const verifyToken = async (req, res, next) => {
    try {
        // User is already attached by authenticateToken middleware
        res.json({
            success: true,
            message: 'Token is valid',
            data: {
                user: req.user,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyToken = verifyToken;
/**
 * Complete Student Profile Controller
 * POST /api/auth/student/complete-profile
 * Requires authentication
 */
const completeProfile = async (req, res, next) => {
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
        const result = await auth_service_1.authService.completeStudentProfile(studentId, fullName.trim());
        res.json({
            success: true,
            message: 'Profile completed successfully',
            data: result,
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'PROFILE_ALREADY_COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Profile has already been completed',
            });
        }
        next(error);
    }
};
exports.completeProfile = completeProfile;
//# sourceMappingURL=auth.controller.js.map