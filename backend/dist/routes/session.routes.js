"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionController = __importStar(require("../controllers/session.controller"));
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const session_validator_1 = require("../validators/session.validator");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// UUID validation schema for params
const uuidParamSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid('Invalid session ID'),
});
const examIdParamSchema = zod_1.z.object({
    examId: zod_1.z.string().uuid('Invalid exam ID'),
});
/**
 * @route   POST /api/sessions/start
 * @desc    Start a new exam session
 * @access  Protected (Student)
 */
router.post('/start', auth_middleware_1.authenticateToken, auth_middleware_1.requireStudent, (0, validate_middleware_1.validateBody)(session_validator_1.startSessionSchema), sessionController.startSession);
/**
 * @route   GET /api/sessions/check/:examId
 * @desc    Check for existing session for this exam
 * @access  Protected (Student)
 */
router.get('/check/:examId', auth_middleware_1.authenticateToken, auth_middleware_1.requireStudent, sessionController.checkExistingSession);
/**
 * @route   GET /api/sessions/:sessionId
 * @desc    Get session details
 * @access  Protected (Student owns session)
 */
router.get('/:sessionId', auth_middleware_1.authenticateToken, sessionController.getSession);
/**
 * @route   GET /api/sessions/:sessionId/recovery
 * @desc    Get recovery data for session
 * @access  Protected (Student)
 */
router.get('/:sessionId/recovery', auth_middleware_1.authenticateToken, auth_middleware_1.requireStudent, sessionController.getRecoveryData);
/**
 * @route   POST /api/sessions/:sessionId/snapshot
 * @desc    Save progress snapshot (auto-save)
 * @access  Protected (Student)
 */
router.post('/:sessionId/snapshot', auth_middleware_1.authenticateToken, auth_middleware_1.requireStudent, (0, validate_middleware_1.validateBody)(session_validator_1.saveSnapshotSchema), sessionController.saveSnapshot);
/**
 * @route   POST /api/sessions/:sessionId/submit
 * @desc    Submit exam (complete session)
 * @access  Protected (Student)
 */
router.post('/:sessionId/submit', auth_middleware_1.authenticateToken, auth_middleware_1.requireStudent, (0, validate_middleware_1.validateBody)(session_validator_1.submitExamSchema), sessionController.completeSession);
exports.default = router;
//# sourceMappingURL=session.routes.js.map