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
const adminController = __importStar(require("../controllers/admin.controller"));
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_validator_1 = require("../validators/admin.validator");
const router = (0, express_1.Router)();
// All routes require admin authentication
router.use(auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin);
/**
 * Dashboard Statistics
 */
router.get('/dashboard/stats', adminController.getDashboardStats);
/**
 * Session Management
 */
router.get('/sessions', (0, validate_middleware_1.validateQuery)(admin_validator_1.sessionFiltersSchema), adminController.getSessions);
router.get('/sessions/:sessionId/details', adminController.getSessionDetails);
router.post('/sessions/:sessionId/notes', adminController.saveSessionQuestionNote);
router.delete('/sessions/:sessionId/notes', adminController.deleteSessionQuestionNote);
router.get('/sessions/export', (0, validate_middleware_1.validateQuery)(admin_validator_1.sessionFiltersSchema), adminController.exportSessions);
/**
 * Student Management
 */
router.get('/students', adminController.getAuthorizedStudents);
router.post('/students/add', (0, validate_middleware_1.validateBody)(admin_validator_1.addStudentSchema), adminController.addAuthorizedStudent);
router.post('/students/remove', (0, validate_middleware_1.validateBody)(admin_validator_1.addStudentSchema.pick({ email: true })), adminController.removeAuthorizedStudent);
router.post('/students/bulk', (0, validate_middleware_1.validateBody)(admin_validator_1.bulkAddStudentsSchema), adminController.bulkAddStudents);
/**
 * Exam Management
 */
router.get('/exams', adminController.getExams);
router.get('/exams/:examId', adminController.getExamById);
router.post('/exams/create', (0, validate_middleware_1.validateBody)(admin_validator_1.createExamSchema), adminController.createExam);
router.patch('/exams/:examId', adminController.updateExam);
router.post('/exams/:examId/activate', (0, validate_middleware_1.validateBody)(admin_validator_1.setExamActiveSchema.omit({ examId: true })), adminController.setExamActive);
router.delete('/exams/:examId', adminController.deleteExam);
/**
 * Question Management
 */
router.get('/exams/:examId/questions', adminController.getExamQuestions);
router.delete('/exams/:examId/questions', adminController.deleteExamQuestions);
router.post('/questions/add', (0, validate_middleware_1.validateBody)(admin_validator_1.addQuestionSchema), adminController.addQuestion);
/**
 * Exam Report & Cell Colors
 */
router.get('/exams/:examId/report', adminController.getExamReport);
router.get('/exams/:examId/report/colors', adminController.getExamReportCellColors);
router.post('/exams/:examId/report/colors', adminController.saveExamReportCellColor);
router.delete('/exams/:examId/report/colors', adminController.deleteExamReportCellColor);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map