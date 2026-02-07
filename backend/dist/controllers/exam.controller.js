"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExamById = exports.getActiveExam = void 0;
const exam_service_1 = require("../services/exam.service");
/**
 * Get Active Exam Controller
 * GET /api/exams/active
 * Returns the currently active exam with all questions
 */
const getActiveExam = async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const exam = await exam_service_1.examService.getActiveExam(studentId);
        res.json({
            success: true,
            message: 'Active exam retrieved successfully',
            data: exam,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getActiveExam = getActiveExam;
/**
 * Get Exam by ID Controller
 * GET /api/exams/:examId
 * Returns a specific exam with all questions (admin only)
 */
const getExamById = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const exam = await exam_service_1.examService.getExamById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found',
                code: 'EXAM_NOT_FOUND',
            });
        }
        res.json({
            success: true,
            message: 'Exam retrieved successfully',
            data: exam,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getExamById = getExamById;
//# sourceMappingURL=exam.controller.js.map