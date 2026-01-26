import { pool } from '../config/database';

export class ExamService {
  /**
   * Get active exam with all questions
   */
  async getActiveExam() {
    // Get active exam
    const examResult = await pool.query(
      'SELECT * FROM exams WHERE is_active = true LIMIT 1'
    );

    if (examResult.rows.length === 0) {
      throw new Error('NO_ACTIVE_EXAM');
    }

    const exam = examResult.rows[0];

    // Get all questions for this exam
    const questionsResult = await pool.query(
      `SELECT * FROM questions
       WHERE exam_id = $1
       ORDER BY question_number`,
      [exam.id]
    );

    // Get options for multiple-choice questions
    const questions = await Promise.all(
      questionsResult.rows.map(async (question) => {
        if (question.question_type === 'multiple-choice') {
          const optionsResult = await pool.query(
            `SELECT option_index, option_text, is_correct
             FROM question_options
             WHERE question_id = $1
             ORDER BY option_index`,
            [question.id]
          );

          return {
            ...question,
            options: optionsResult.rows.map((opt) => ({
              index: opt.option_index,
              text: opt.option_text,
              isCorrect: opt.is_correct,
            })),
          };
        }

        return question;
      })
    );

    return {
      exam,
      questions,
    };
  }

  /**
   * Get exam by ID
   */
  async getExamById(examId: string) {
    const result = await pool.query('SELECT * FROM exams WHERE id = $1', [examId]);
    return result.rows[0] || null;
  }
}

export const examService = new ExamService();
