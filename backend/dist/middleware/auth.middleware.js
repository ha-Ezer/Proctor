"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAdmin = exports.requireStudent = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
/**
 * Middleware to verify JWT token and attach user to request
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required',
            code: 'TOKEN_MISSING',
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: 'Token has expired',
                code: 'TOKEN_EXPIRED',
            });
        }
        return res.status(403).json({
            success: false,
            message: 'Invalid token',
            code: 'TOKEN_INVALID',
        });
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware to verify user is a student
 */
const requireStudent = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
            code: 'AUTH_REQUIRED',
        });
    }
    if (req.user.type !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Student access required',
            code: 'STUDENT_REQUIRED',
        });
    }
    next();
};
exports.requireStudent = requireStudent;
/**
 * Middleware to verify user is an admin
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
            code: 'AUTH_REQUIRED',
        });
    }
    if (req.user.type !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required',
            code: 'ADMIN_REQUIRED',
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;
/**
 * Optional authentication - attaches user if token is valid, but doesn't block if missing
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
        req.user = decoded;
    }
    catch (error) {
        // Ignore errors for optional auth
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map