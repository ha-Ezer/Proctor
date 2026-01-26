import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { adminService } from '../services/admin.service';

/**
 * Get All Sessions Controller
 * GET /api/admin/sessions
 */
export const getSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = req.query;

    const result = await adminService.getSessions(filters);

    res.json({
      success: true,
      message: 'Sessions retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Session Details Controller
 * GET /api/admin/sessions/:sessionId/details
 */
export const getSessionDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const details = await adminService.getSessionDetails(sessionId);

    res.json({
      success: true,
      message: 'Session details retrieved successfully',
      data: details,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Dashboard Stats Controller
 * GET /api/admin/dashboard/stats
 */
export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getDashboardStats();

    res.json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Sessions Controller
 * GET /api/admin/sessions/export
 */
export const exportSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = req.query;

    const csvData = await adminService.exportSessions(filters);

    res.json({
      success: true,
      message: 'Session data exported successfully',
      data: csvData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Authorized Students Controller
 * GET /api/admin/students
 */
export const getAuthorizedStudents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const students = await adminService.getAuthorizedStudents();

    res.json({
      success: true,
      message: 'Authorized students retrieved successfully',
      data: {
        students,
        count: students.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Authorized Student Controller
 * POST /api/admin/students/add
 */
export const addAuthorizedStudent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, fullName } = req.body;

    const student = await adminService.addAuthorizedStudent(email, fullName);

    res.status(201).json({
      success: true,
      message: 'Student authorized successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove Authorized Student Controller
 * POST /api/admin/students/remove
 */
export const removeAuthorizedStudent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const student = await adminService.removeAuthorizedStudent(email);

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
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Add Students Controller
 * POST /api/admin/students/bulk
 */
export const bulkAddStudents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { students } = req.body;

    const results = await adminService.bulkAddStudents(students);

    res.status(201).json({
      success: true,
      message: `${results.length} students authorized successfully`,
      data: {
        students: results,
        count: results.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Exams Controller
 * GET /api/admin/exams
 */
export const getExams = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const exams = await adminService.getExams();

    res.json({
      success: true,
      message: 'Exams retrieved successfully',
      data: {
        exams,
        count: exams.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Exam By ID Controller
 * GET /api/admin/exams/:examId
 */
export const getExamById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const exam = await adminService.getExamById(examId);

    res.json({
      success: true,
      message: 'Exam retrieved successfully',
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Exam Controller
 * POST /api/admin/exams/create
 */
export const createExam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, version, durationMinutes, maxViolations } = req.body;

    const exam = await adminService.createExam({
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
  } catch (error) {
    next(error);
  }
};

/**
 * Update Exam Controller
 * PATCH /api/admin/exams/:examId
 */
export const updateExam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const updateData = req.body;

    const exam = await adminService.updateExam(examId, updateData);

    res.json({
      success: true,
      message: 'Exam updated successfully',
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Question Controller
 * POST /api/admin/questions/add
 */
export const addQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId, questionNumber, questionText, questionType, required, placeholder, imageUrl, options, correctAnswer } =
      req.body;

    const result = await adminService.addQuestion({
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
  } catch (error) {
    next(error);
  }
};

/**
 * Get Exam Questions Controller
 * GET /api/admin/exams/:examId/questions
 */
export const getExamQuestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;

    const questions = await adminService.getExamQuestions(examId);

    res.json({
      success: true,
      message: 'Questions retrieved successfully',
      data: { questions, count: questions.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set Exam Active Controller
 * POST /api/admin/exams/:examId/activate
 */
export const setExamActive = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const { isActive } = req.body;

    const exam = await adminService.setExamActive(examId, isActive);

    res.json({
      success: true,
      message: isActive ? 'Exam activated successfully' : 'Exam deactivated successfully',
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExamQuestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    await adminService.deleteExamQuestions(examId);
    res.json({
      success: true,
      message: 'Questions deleted successfully',
      data: { success: true },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Exam Controller
 * DELETE /api/admin/exams/:examId
 */
export const deleteExam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const result = await adminService.deleteExam(examId);

    res.json({
      success: true,
      message: `Exam "${result.examTitle}" deleted successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Exam Report Controller
 * GET /api/admin/exams/:examId/report
 */
export const getExamReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const report = await adminService.getExamReport(examId);

    res.json({
      success: true,
      message: 'Exam report retrieved successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save Exam Report Cell Color Controller
 * POST /api/admin/exams/:examId/report/colors
 */
export const saveExamReportCellColor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const { sessionId, questionId, color } = req.body;

    await adminService.saveExamReportCellColor(examId, sessionId, questionId, color);

    res.json({
      success: true,
      message: 'Cell color saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Exam Report Cell Colors Controller
 * GET /api/admin/exams/:examId/report/colors
 */
export const getExamReportCellColors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const colors = await adminService.getExamReportCellColors(examId);

    res.json({
      success: true,
      message: 'Cell colors retrieved successfully',
      data: { colors },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Exam Report Cell Color Controller
 * DELETE /api/admin/exams/:examId/report/colors
 */
export const deleteExamReportCellColor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const { sessionId, questionId } = req.body;

    await adminService.deleteExamReportCellColor(examId, sessionId, questionId);

    res.json({
      success: true,
      message: 'Cell color deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save Session Question Note Controller
 * POST /api/admin/sessions/:sessionId/notes
 */
export const saveSessionQuestionNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    await adminService.saveSessionQuestionNote(sessionId, questionId, note, adminId);

    res.json({
      success: true,
      message: 'Note saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Session Question Note Controller
 * DELETE /api/admin/sessions/:sessionId/notes
 */
export const deleteSessionQuestionNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { questionId } = req.body;

    await adminService.deleteSessionQuestionNote(sessionId, questionId);

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
