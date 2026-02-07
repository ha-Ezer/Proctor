"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearSessionSnapshots = exports.clearExamSnapshots = exports.getExamSnapshots = exports.deleteSessionQuestionNote = exports.saveSessionQuestionNote = exports.deleteExamReportCellColor = exports.getExamReportCellColors = exports.saveExamReportCellColor = exports.getExamReport = exports.deleteExam = exports.deleteExamQuestions = exports.setExamActive = exports.getExamQuestions = exports.addQuestion = exports.updateExam = exports.createExam = exports.getExamById = exports.getExams = exports.bulkAddStudents = exports.removeAuthorizedStudent = exports.addAuthorizedStudent = exports.getAuthorizedStudents = exports.exportSessions = exports.getDashboardStats = exports.getSessionDetails = exports.getSessions = void 0;
const admin_service_1 = require("../services/admin.service");
/**
 * Get All Sessions Controller
 * GET /api/admin/sessions
 */
const getSessions = async (req, res, next) => {
    try {
        const filters = req.query;
        const result = await admin_service_1.adminService.getSessions(filters);
        res.json({
            success: true,
            message: 'Sessions retrieved successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSessions = getSessions;
/**
 * Get Session Details Controller
 * GET /api/admin/sessions/:sessionId/details
 */
const getSessionDetails = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const details = await admin_service_1.adminService.getSessionDetails(sessionId);
        res.json({
            success: true,
            message: 'Session details retrieved successfully',
            data: details,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSessionDetails = getSessionDetails;
/**
 * Get Dashboard Stats Controller
 * GET /api/admin/dashboard/stats
 */
const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await admin_service_1.adminService.getDashboardStats();
        res.json({
            success: true,
            message: 'Dashboard statistics retrieved successfully',
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
/**
 * Export Sessions Controller
 * GET /api/admin/sessions/export
 */
const exportSessions = async (req, res, next) => {
    try {
        const filters = req.query;
        const csvData = await admin_service_1.adminService.exportSessions(filters);
        res.json({
            success: true,
            message: 'Session data exported successfully',
            data: csvData,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.exportSessions = exportSessions;
/**
 * Get Authorized Students Controller
 * GET /api/admin/students
 */
const getAuthorizedStudents = async (req, res, next) => {
    try {
        const students = await admin_service_1.adminService.getAuthorizedStudents();
        res.json({
            success: true,
            message: 'Authorized students retrieved successfully',
            data: {
                students,
                count: students.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAuthorizedStudents = getAuthorizedStudents;
/**
 * Add Authorized Student Controller
 * POST /api/admin/students/add
 */
const addAuthorizedStudent = async (req, res, next) => {
    try {
        const { email, fullName } = req.body;
        const student = await admin_service_1.adminService.addAuthorizedStudent(email, fullName);
        res.status(201).json({
            success: true,
            message: 'Student authorized successfully',
            data: student,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addAuthorizedStudent = addAuthorizedStudent;
/**
 * Remove Authorized Student Controller
 * POST /api/admin/students/remove
 */
const removeAuthorizedStudent = async (req, res, next) => {
    try {
        const { email } = req.body;
        const student = await admin_service_1.adminService.removeAuthorizedStudent(email);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
                code: 'STUDENT_NOT_FOUND',
            });
        }
        res.json({
            success: true,
            message: 'Student authorization revoked successfully',
            data: student,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.removeAuthorizedStudent = removeAuthorizedStudent;
/**
 * Bulk Add Students Controller
 * POST /api/admin/students/bulk
 */
const bulkAddStudents = async (req, res, next) => {
    try {
        const { students } = req.body;
        const results = await admin_service_1.adminService.bulkAddStudents(students);
        res.status(201).json({
            success: true,
            message: `${results.length} students authorized successfully`,
            data: {
                students: results,
                count: results.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.bulkAddStudents = bulkAddStudents;
/**
 * Get All Exams Controller
 * GET /api/admin/exams
 */
const getExams = async (req, res, next) => {
    try {
        const exams = await admin_service_1.adminService.getExams();
        res.json({
            success: true,
            message: 'Exams retrieved successfully',
            data: {
                exams,
                count: exams.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getExams = getExams;
/**
 * Get Exam By ID Controller
 * GET /api/admin/exams/:examId
 */
const getExamById = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const exam = await admin_service_1.adminService.getExamById(examId);
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
/**
 * Create Exam Controller
 * POST /api/admin/exams/create
 */
const createExam = async (req, res, next) => {
    try {
        const { title, description, version, durationMinutes, maxViolations } = req.body;
        const exam = await admin_service_1.adminService.createExam({
            title,
            description,
            version,
            durationMinutes,
            maxViolations,
        });
        res.status(201).json({
            success: true,
            message: 'Exam created successfully',
            data: exam,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createExam = createExam;
/**
 * Update Exam Controller
 * PATCH /api/admin/exams/:examId
 */
const updateExam = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const updateData = req.body;
        const exam = await admin_service_1.adminService.updateExam(examId, updateData);
        res.json({
            success: true,
            message: 'Exam updated successfully',
            data: exam,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateExam = updateExam;
/**
 * Add Question Controller
 * POST /api/admin/questions/add
 */
const addQuestion = async (req, res, next) => {
    try {
        const { examId, questionNumber, questionText, questionType, required, placeholder, imageUrl, options, correctAnswer } = req.body;
        const result = await admin_service_1.adminService.addQuestion({
            examId,
            questionNumber,
            questionText,
            questionType,
            required,
            placeholder,
            imageUrl,
            options,
            correctAnswer,
        });
        res.status(201).json({
            success: true,
            message: 'Question added successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addQuestion = addQuestion;
/**
 * Get Exam Questions Controller
 * GET /api/admin/exams/:examId/questions
 */
const getExamQuestions = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const questions = await admin_service_1.adminService.getExamQuestions(examId);
        res.json({
            success: true,
            message: 'Questions retrieved successfully',
            data: { questions, count: questions.length },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getExamQuestions = getExamQuestions;
/**
 * Set Exam Active Controller
 * POST /api/admin/exams/:examId/activate
 */
const setExamActive = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const { isActive } = req.body;
        const exam = await admin_service_1.adminService.setExamActive(examId, isActive);
        res.json({
            success: true,
            message: isActive ? 'Exam activated successfully' : 'Exam deactivated successfully',
            data: exam,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.setExamActive = setExamActive;
const deleteExamQuestions = async (req, res, next) => {
    try {
        const { examId } = req.params;
        await admin_service_1.adminService.deleteExamQuestions(examId);
        res.json({
            success: true,
            message: 'Questions deleted successfully',
            data: { success: true },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteExamQuestions = deleteExamQuestions;
/**
 * Delete Exam Controller
 * DELETE /api/admin/exams/:examId
 */
const deleteExam = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const result = await admin_service_1.adminService.deleteExam(examId);
        res.json({
            success: true,
            message: `Exam "${result.examTitle}" deleted successfully`,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteExam = deleteExam;
/**
 * Get Exam Report Controller
 * GET /api/admin/exams/:examId/report
 */
const getExamReport = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const report = await admin_service_1.adminService.getExamReport(examId);
        res.json({
            success: true,
            message: 'Exam report retrieved successfully',
            data: report,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getExamReport = getExamReport;
/**
 * Save Exam Report Cell Color Controller
 * POST /api/admin/exams/:examId/report/colors
 */
const saveExamReportCellColor = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const { sessionId, questionId, color } = req.body;
        await admin_service_1.adminService.saveExamReportCellColor(examId, sessionId, questionId, color);
        res.json({
            success: true,
            message: 'Cell color saved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.saveExamReportCellColor = saveExamReportCellColor;
/**
 * Get Exam Report Cell Colors Controller
 * GET /api/admin/exams/:examId/report/colors
 */
const getExamReportCellColors = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const colors = await admin_service_1.adminService.getExamReportCellColors(examId);
        res.json({
            success: true,
            message: 'Cell colors retrieved successfully',
            data: { colors },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getExamReportCellColors = getExamReportCellColors;
/**
 * Delete Exam Report Cell Color Controller
 * DELETE /api/admin/exams/:examId/report/colors
 */
const deleteExamReportCellColor = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const { sessionId, questionId } = req.body;
        await admin_service_1.adminService.deleteExamReportCellColor(examId, sessionId, questionId);
        res.json({
            success: true,
            message: 'Cell color deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteExamReportCellColor = deleteExamReportCellColor;
/**
 * Save Session Question Note Controller
 * POST /api/admin/sessions/:sessionId/notes
 */
const saveSessionQuestionNote = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { questionId, note } = req.body;
        const adminId = req.user?.id;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Admin ID not found',
            });
        }
        await admin_service_1.adminService.saveSessionQuestionNote(sessionId, questionId, note, adminId);
        res.json({
            success: true,
            message: 'Note saved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.saveSessionQuestionNote = saveSessionQuestionNote;
/**
 * Delete Session Question Note Controller
 * DELETE /api/admin/sessions/:sessionId/notes
 */
const deleteSessionQuestionNote = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { questionId } = req.body;
        await admin_service_1.adminService.deleteSessionQuestionNote(sessionId, questionId);
        res.json({
            success: true,
            message: 'Note deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSessionQuestionNote = deleteSessionQuestionNote;
/**
 * Get Exam Snapshots Controller
 * GET /api/admin/exams/:examId/snapshots
 */
const getExamSnapshots = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const { latest } = req.query;
        const result = latest === 'true'
            ? await admin_service_1.adminService.getExamLatestSnapshots(examId)
            : await admin_service_1.adminService.getExamSnapshots(examId);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getExamSnapshots = getExamSnapshots;
/**
 * Clear Exam Snapshots Controller
 * DELETE /api/admin/exams/:examId/snapshots
 */
const clearExamSnapshots = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const result = await admin_service_1.adminService.clearExamSnapshots(examId);
        res.json({
            success: true,
            message: `Cleared ${result.deletedCount} snapshot(s)`,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.clearExamSnapshots = clearExamSnapshots;
/**
 * Clear Session Snapshots Controller
 * DELETE /api/admin/sessions/:sessionId/snapshots
 */
const clearSessionSnapshots = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const result = await admin_service_1.adminService.clearSessionSnapshots(sessionId);
        res.json({
            success: true,
            message: `Cleared ${result.deletedCount} snapshot(s)`,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.clearSessionSnapshots = clearSessionSnapshots;
//# sourceMappingURL=admin.controller.js.map