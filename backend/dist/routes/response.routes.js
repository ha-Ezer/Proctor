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
const responseController = __importStar(require("../controllers/response.controller"));
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const session_validator_1 = require("../validators/session.validator");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Bulk save schema
const bulkSaveSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
    responses: zod_1.z.array(zod_1.z.object({
        questionId: zod_1.z.string().uuid(),
        responseText: zod_1.z.string().optional(),
        responseOptionIndex: zod_1.z.number().int().min(0).optional(),
    })),
});
/**
 * @route   POST /api/responses/save
 * @desc    Save a single response (auto-save)
 * @access  Protected (Student)
 */
router.post('/save', auth_middleware_1.authenticateToken, auth_middleware_1.requireStudent, rateLimit_middleware_1.responseLimiter, (0, validate_middleware_1.validateBody)(session_validator_1.saveResponseSchema), responseController.saveResponse);
/**
 * @route   POST /api/responses/bulk
 * @desc    Save multiple responses at once
 * @access  Protected (Student)
 */
router.post('/bulk', auth_middleware_1.authenticateToken, auth_middleware_1.requireStudent, (0, validate_middleware_1.validateBody)(bulkSaveSchema), responseController.bulkSaveResponses);
/**
 * @route   GET /api/responses/session/:sessionId
 * @desc    Get all responses for a session
 * @access  Protected (Student/Admin)
 */
router.get('/session/:sessionId', auth_middleware_1.authenticateToken, responseController.getSessionResponses);
exports.default = router;
//# sourceMappingURL=response.routes.js.map