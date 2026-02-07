import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { examService } from '../services/exam.service';

/**
 * Get Active Exam Controller
 * GET /api/exams/active
 * Returns the currently active exam with all questions
 */
export const getActiveExam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.id;
    const exam = await examService.getActiveExam(studentId);

    res.json({
      success: true,
      message: 'Active exam retrieved successfully',
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Exam by ID Controller
 * GET /api/exams/:examId
 * Returns a specific exam with all questions (admin only)
 */
export const getExamById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;

    const exam = await examService.getExamById(examId);

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
  } catch (error) {
    next(error);
  }
};
