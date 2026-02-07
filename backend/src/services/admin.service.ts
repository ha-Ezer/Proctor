import { pool, getClient } from '../config/database';

export interface SessionFilters {
  status?: 'in_progress' | 'completed' | 'terminated' | 'expired' | 'all';
  examId?: string;
  studentEmail?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'start_time' | 'status' | 'violations' | 'score';
  sortOrder?: 'asc' | 'desc';
}

export class AdminService {
  /**
   * Get all sessions with filtering, sorting, and pagination
   */
  async getSessions(filters: SessionFilters) {
    const {
      status = 'all',
      examId,
      studentEmail,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'start_time',
      sortOrder = 'desc',
    } = filters;

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (status !== 'all') {
      paramCount++;
      conditions.push(`es.status = $${paramCount}`);
      params.push(status);
    }

    if (examId) {
      paramCount++;
      conditions.push(`es.exam_id = $${paramCount}`);
      params.push(examId);
    }

    if (studentEmail) {
      paramCount++;
      conditions.push(`LOWER(s.email) = LOWER($${paramCount})`);
      params.push(studentEmail);
    }

    if (startDate) {
      paramCount++;
      conditions.push(`es.start_time >= $${paramCount}`);
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      conditions.push(`es.start_time <= $${paramCount}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM exam_sessions es
       JOIN students s ON es.student_id = s.id
       JOIN exams e ON es.exam_id = e.id
       ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Get sessions
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const sessionsResult = await pool.query(
      `SELECT
        es.id,
        es.session_id,
        es.start_time,
        es.end_time,
        es.status,
        es.completion_percentage,
        es.total_violations,
        es.score,
        es.submission_type,
        s.email as student_email,
        s.full_name as student_name,
        e.title as exam_title,
        e.version as exam_version
       FROM exam_sessions es
       JOIN students s ON es.student_id = s.id
       JOIN exams e ON es.exam_id = e.id
       ${whereClause}
       ORDER BY es.${sortBy} ${sortOrder.toUpperCase()}
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, limit, offset]
    );

    return {
      sessions: sessionsResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get detailed session information including questions and responses
   */
  async getSessionDetails(sessionId: string) {
    console.log('[AdminService] getSessionDetails called with sessionId:', sessionId);

    // Get session info
    const sessionResult = await pool.query(
      `SELECT
        es.*,
        s.email as student_email,
        s.full_name as student_name,
        e.title as exam_title,
        e.version as exam_version,
        e.duration_minutes
       FROM exam_sessions es
       JOIN students s ON es.student_id = s.id
       JOIN exams e ON es.exam_id = e.id
       WHERE es.id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('SESSION_NOT_FOUND');
    }

    const session = sessionResult.rows[0];
    console.log('[AdminService] Found session:', { id: session.id, session_id: session.session_id, student: session.student_name });

    // Get all questions for the exam (so we show every question, answered or not)
    const questionsResult = await pool.query(
      `SELECT id, question_number, question_text, question_type, image_url
       FROM questions
       WHERE exam_id = $1
       ORDER BY question_number`,
      [session.exam_id]
    );
    const allQuestions = questionsResult.rows;

    // Get all responses for this session (may be fewer than questions)
    const responsesResult = await pool.query(
      `SELECT
        r.*,
        q.question_number,
        q.question_text,
        q.question_type,
        q.image_url
       FROM responses r
       JOIN questions q ON r.question_id = q.id
       WHERE r.session_id = $1
       ORDER BY q.question_number`,
      [session.id]
    );
    const responseByQuestionId = new Map(responsesResult.rows.map((r: any) => [r.question_id, r]));
    console.log('[AdminService] Found responses:', responsesResult.rows.length, 'questions:', allQuestions.length);

    // Get violations
    const violationsResult = await pool.query(
      `SELECT violation_type, severity, description, detected_at, browser_info
       FROM violations
       WHERE session_id = $1
       ORDER BY detected_at`,
      [session.id]
    );

    // Get notes for each question (table may not exist if migration not run)
    let notesRows: { question_id: string; note: string; created_by: string; created_at: string; updated_by: string; updated_at: string }[] = [];
    try {
      const notesResult = await pool.query(
        `SELECT question_id, note, created_by, created_at, updated_by, updated_at
         FROM session_question_notes
         WHERE session_id = $1`,
        [session.id]
      );
      notesRows = notesResult.rows;
    } catch (notesErr: any) {
      if (notesErr?.code !== '42P01') {
        throw notesErr;
      }
      // Table does not exist; continue with no notes
    }

    // Create a map of question_id -> note
    const notesMap = new Map();
    notesRows.forEach((noteRow) => {
      notesMap.set(noteRow.question_id, {
        note: noteRow.note,
        createdBy: noteRow.created_by,
        createdAt: noteRow.created_at,
        updatedBy: noteRow.updated_by,
        updatedAt: noteRow.updated_at,
      });
    });

    // Build one entry per question (with response when present, empty when not)
    const responsesWithNotes = await Promise.all(
      allQuestions.map(async (q: any) => {
        const response = responseByQuestionId.get(q.id);
        const note = notesMap.get(q.id);

        if (q.question_type === 'multiple-choice') {
          const optionsResult = await pool.query(
            `SELECT option_index, option_text, is_correct
             FROM question_options
             WHERE question_id = $1
             ORDER BY option_index`,
            [q.id]
          );
          const options = optionsResult.rows;
          const selectedOption =
            response && response.response_option_index !== null
              ? options[response.response_option_index]
              : null;

          return {
            questionId: q.id,
            questionNumber: q.question_number,
            questionText: q.question_text,
            questionType: q.question_type,
            imageUrl: q.image_url,
            options: options.map((o: any) => o.option_text),
            selectedOptionIndex: response?.response_option_index ?? null,
            selectedOption: selectedOption?.option_text || null,
            correctAnswer: options.find((o: any) => o.is_correct)?.option_text || null,
            isCorrect: response?.is_correct ?? null,
            answeredAt: response?.answered_at ?? null,
            note: note?.note || null,
          };
        }

        return {
          questionId: q.id,
          questionNumber: q.question_number,
          questionText: q.question_text,
          questionType: q.question_type,
          imageUrl: q.image_url,
          responseText: response?.response_text ?? null,
          answeredAt: response?.answered_at ?? null,
          note: note?.note || null,
        };
      })
    );

    console.log('[AdminService] Found violations:', violationsResult.rows.length);
    console.log('[AdminService] Found notes:', notesRows.length);
    console.log('[AdminService] Returning data:', {
      hasSession: !!session,
      responsesCount: responsesWithNotes.length,
      violationsCount: violationsResult.rows.length,
      notesCount: notesRows.length
    });

    return {
      session,
      responses: responsesWithNotes,
      violations: violationsResult.rows,
    };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    // Total sessions
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM exam_sessions');

    // Active sessions
    const activeResult = await pool.query(
      "SELECT COUNT(*) as count FROM exam_sessions WHERE status = 'in_progress'"
    );

    // Completed sessions
    const completedResult = await pool.query(
      "SELECT COUNT(*) as count FROM exam_sessions WHERE status = 'completed'"
    );

    // Completed today
    const completedTodayResult = await pool.query(
      `SELECT COUNT(*) as count FROM exam_sessions
       WHERE status = 'completed' AND DATE(end_time) = CURRENT_DATE`
    );

    // Total students
    const studentsResult = await pool.query('SELECT COUNT(*) as count FROM students WHERE is_authorized = true');

    // Total exams
    const examsResult = await pool.query('SELECT COUNT(*) as count FROM exams');

    // Average completion rate
    const avgCompletionResult = await pool.query(
      'SELECT AVG(completion_percentage) as avg FROM exam_sessions WHERE completion_percentage IS NOT NULL'
    );

    // Average violations
    const avgViolationsResult = await pool.query('SELECT AVG(total_violations) as avg FROM exam_sessions');

    // Average score
    const avgScoreResult = await pool.query('SELECT AVG(score) as avg FROM exam_sessions WHERE score IS NOT NULL');

    // Flagged sessions
    const flaggedResult = await pool.query(
      "SELECT COUNT(*) as count FROM proctoring_reports WHERE status = 'flagged_for_review'"
    );

    // Recent sessions
    const recentResult = await pool.query(
      `SELECT
        es.session_id,
        es.start_time,
        es.status,
        s.full_name as student_name,
        e.title as exam_title
       FROM exam_sessions es
       JOIN students s ON es.student_id = s.id
       JOIN exams e ON es.exam_id = e.id
       ORDER BY es.start_time DESC
       LIMIT 10`
    );

    // Violation trends
    const violationTrendsResult = await pool.query(
      `SELECT violation_type, COUNT(*) as count
       FROM violations
       GROUP BY violation_type
       ORDER BY count DESC
       LIMIT 10`
    );

    return {
      totalSessions: parseInt(totalResult.rows[0].count),
      activeSessions: parseInt(activeResult.rows[0].count),
      completedSessions: parseInt(completedResult.rows[0].count),
      completedToday: parseInt(completedTodayResult.rows[0].count),
      totalStudents: parseInt(studentsResult.rows[0].count),
      totalExams: parseInt(examsResult.rows[0].count),
      averageCompletionRate: parseFloat(avgCompletionResult.rows[0].avg || 0).toFixed(2),
      averageViolations: parseFloat(avgViolationsResult.rows[0].avg || 0).toFixed(2),
      averageScore: parseFloat(avgScoreResult.rows[0].avg || 0).toFixed(2),
      flaggedSessions: parseInt(flaggedResult.rows[0].count),
      recentSessions: recentResult.rows,
      violationTrends: violationTrendsResult.rows,
    };
  }

  /**
   * Export sessions as CSV data
   */
  async exportSessions(filters: SessionFilters) {
    const { sessions } = await this.getSessions({ ...filters, limit: 10000 }); // Get all matching

    const csvData = sessions.map((session) => ({
      sessionId: session.session_id,
      studentName: session.student_name,
      studentEmail: session.student_email,
      examTitle: session.exam_title,
      startTime: session.start_time,
      endTime: session.end_time,
      status: session.status,
      completionPercentage: session.completion_percentage,
      totalViolations: session.total_violations,
      score: session.score,
      submissionType: session.submission_type,
    }));

    return csvData;
  }

  /**
   * Manage authorized students - Add new student
   */
  async addAuthorizedStudent(email: string, fullName?: string) {
    // Use empty string when fullName missing so INSERT works even if full_name is NOT NULL (migration not run)
    const nameValue = fullName?.trim() || '';
    const result = await pool.query(
      `INSERT INTO students (email, full_name, is_authorized)
       VALUES ($1, $2, true)
       ON CONFLICT (email) DO UPDATE SET
         is_authorized = true,
         full_name = COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), students.full_name),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [email, nameValue]
    );

    return result.rows[0];
  }

  /**
   * Remove student authorization
   */
  async removeAuthorizedStudent(email: string) {
    const result = await pool.query(
      `UPDATE students
       SET is_authorized = false,
           updated_at = CURRENT_TIMESTAMP
       WHERE LOWER(email) = LOWER($1)
       RETURNING *`,
      [email]
    );

    return result.rows[0];
  }

  /**
   * Bulk add students from CSV data
   */
  async bulkAddStudents(students: Array<{ email: string; fullName: string }>) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const results = [];
      for (const student of students) {
        const result = await client.query(
          `INSERT INTO students (email, full_name, is_authorized)
           VALUES ($1, $2, true)
           ON CONFLICT (email) DO UPDATE SET
             is_authorized = true,
             full_name = EXCLUDED.full_name,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [student.email, student.fullName]
        );

        results.push(result.rows[0]);
      }

      await client.query('COMMIT');
      console.log(`✅ Bulk added ${results.length} students`);

      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all students (authorized and unauthorized)
   * Includes authorization status and session count
   */
  async getAuthorizedStudents() {
    const result = await pool.query(
      `SELECT 
         s.id,
         s.email,
         s.full_name,
         s.is_authorized,
         s.last_login,
         s.created_at,
         COUNT(DISTINCT es.id) as total_sessions
       FROM students s
       LEFT JOIN exam_sessions es ON es.student_id = s.id
       GROUP BY s.id, s.email, s.full_name, s.is_authorized, s.last_login, s.created_at
       ORDER BY s.full_name NULLS LAST, s.email`
    );

    // Map database field names to frontend expected names
    return result.rows.map((row) => {
      // PostgreSQL COUNT returns bigint as string, convert to number
      const sessionCount = row.total_sessions != null 
        ? (typeof row.total_sessions === 'string' 
            ? parseInt(row.total_sessions, 10) 
            : Number(row.total_sessions))
        : 0;
      
      return {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        isAuthorized: row.is_authorized,
        lastLogin: row.last_login,
        createdAt: row.created_at,
        totalSessions: sessionCount,
      };
    });
  }

  /**
   * Create new exam
   */
  async createExam(data: {
    title: string;
    description?: string;
    version: string;
    durationMinutes: number;
    maxViolations?: number;
  }) {
    const result = await pool.query(
      `INSERT INTO exams (
        title, description, version, duration_minutes, max_violations, is_active
      ) VALUES ($1, $2, $3, $4, $5, false)
      RETURNING *`,
      [data.title, data.description, data.version, data.durationMinutes, data.maxViolations || 7]
    );

    return result.rows[0];
  }

  /**
   * Add question to exam
   */
  async addQuestion(data: {
    examId: string;
    questionNumber: number;
    questionText: string;
    questionType: 'multiple-choice' | 'text' | 'textarea';
    required?: boolean;
    placeholder?: string;
    imageUrl?: string;
    options?: string[];
    correctAnswer?: number;
  }) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get the next available question number if not provided or if conflict exists
      let questionNumber = data.questionNumber;
      const maxQuestionResult = await client.query(
        `SELECT COALESCE(MAX(question_number), 0) as max_num
         FROM questions
         WHERE exam_id = $1`,
        [data.examId]
      );
      const nextAvailableNumber = maxQuestionResult.rows[0].max_num + 1;

      // If the provided question number already exists, use the next available
      const existingCheck = await client.query(
        `SELECT id FROM questions WHERE exam_id = $1 AND question_number = $2`,
        [data.examId, questionNumber]
      );

      if (existingCheck.rows.length > 0) {
        questionNumber = nextAvailableNumber;
      }

      // Insert question
      const questionResult = await client.query(
        `INSERT INTO questions (
          exam_id, question_number, question_text, question_type,
          required, placeholder, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          data.examId,
          questionNumber,
          data.questionText,
          data.questionType,
          data.required || false,
          data.placeholder,
          data.imageUrl,
        ]
      );

      const questionId = questionResult.rows[0].id;

      // Add options for multiple-choice
      if (data.questionType === 'multiple-choice' && data.options && data.options.length > 0) {
        for (let i = 0; i < data.options.length; i++) {
          await client.query(
            `INSERT INTO question_options (
              question_id, option_index, option_text, is_correct
            ) VALUES ($1, $2, $3, $4)`,
            [questionId, i, data.options[i], i === data.correctAnswer]
          );
        }
      }

      await client.query('COMMIT');

      return { questionId, success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Activate/deactivate exam
   */
  async setExamActive(examId: string, isActive: boolean) {
    // If activating, deactivate all other exams first
    if (isActive) {
      await pool.query('UPDATE exams SET is_active = false WHERE is_active = true');
    }

    const result = await pool.query(
      'UPDATE exams SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [isActive, examId]
    );

    return result.rows[0];
  }

  /**
   * Update exam
   */
  async updateExam(examId: string, data: Partial<{
    title: string;
    description: string;
    version: string;
    durationMinutes: number;
    maxViolations: number;
    enableFullscreen: boolean;
    autoSaveIntervalSeconds: number;
    warningAtMinutes: number;
    minTimeGuaranteeMinutes: number;
    useGroupAccess: boolean;
  }>) {
    // Build dynamic UPDATE query based on provided fields
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (data.title !== undefined) {
      paramCount++;
      fields.push(`title = $${paramCount}`);
      values.push(data.title);
    }

    if (data.description !== undefined) {
      paramCount++;
      fields.push(`description = $${paramCount}`);
      values.push(data.description);
    }

    if (data.version !== undefined) {
      paramCount++;
      fields.push(`version = $${paramCount}`);
      values.push(data.version);
    }

    if (data.durationMinutes !== undefined) {
      paramCount++;
      fields.push(`duration_minutes = $${paramCount}`);
      values.push(data.durationMinutes);
    }

    if (data.maxViolations !== undefined) {
      paramCount++;
      fields.push(`max_violations = $${paramCount}`);
      values.push(data.maxViolations);
    }

    if (data.enableFullscreen !== undefined) {
      paramCount++;
      fields.push(`enable_fullscreen = $${paramCount}`);
      values.push(data.enableFullscreen);
    }

    if (data.autoSaveIntervalSeconds !== undefined) {
      paramCount++;
      fields.push(`auto_save_interval_seconds = $${paramCount}`);
      values.push(data.autoSaveIntervalSeconds);
    }

    if (data.warningAtMinutes !== undefined) {
      paramCount++;
      fields.push(`warning_at_minutes = $${paramCount}`);
      values.push(data.warningAtMinutes);
    }

    if (data.minTimeGuaranteeMinutes !== undefined) {
      paramCount++;
      fields.push(`min_time_guarantee_minutes = $${paramCount}`);
      values.push(data.minTimeGuaranteeMinutes);
    }

    if (data.useGroupAccess !== undefined) {
      paramCount++;
      fields.push(`use_group_access = $${paramCount}`);
      values.push(data.useGroupAccess);
    }

    if (fields.length === 0) {
      throw new Error('No fields provided for update');
    }

    // Always update updated_at (no parameter needed for CURRENT_TIMESTAMP)
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add examId as the last parameter
    paramCount++;
    values.push(examId);

    const query = `
      UPDATE exams
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Exam not found');
    }

    return result.rows[0];
  }

  /**
   * Get all exams
   */
  async getExams() {
    const result = await pool.query(
      `SELECT
        e.*,
        COUNT(q.id) as question_count
       FROM exams e
       LEFT JOIN questions q ON q.exam_id = e.id
       GROUP BY e.id
       ORDER BY e.created_at DESC`
    );

    return result.rows;
  }

  /**
   * Get exam by ID
   */
  async getExamById(examId: string) {
    const result = await pool.query(
      `SELECT
        e.*,
        COUNT(q.id) as question_count
       FROM exams e
       LEFT JOIN questions q ON q.exam_id = e.id
       WHERE e.id = $1
       GROUP BY e.id`,
      [examId]
    );

    if (result.rows.length === 0) {
      throw new Error('Exam not found');
    }

    return result.rows[0];
  }

  /**
   * Get questions for an exam
   */
  async getExamQuestions(examId: string) {
    // Get all questions for the exam
    const questionsResult = await pool.query(
      `SELECT
        id, exam_id, question_number, question_text, question_type,
        required, placeholder, image_url
       FROM questions
       WHERE exam_id = $1
       ORDER BY question_number ASC`,
      [examId]
    );

    // Enrich multiple-choice questions with options
    const questions = await Promise.all(
      questionsResult.rows.map(async (question) => {
        if (question.question_type === 'multiple-choice') {
          const optionsResult = await pool.query(
            `SELECT option_index, option_text, is_correct
             FROM question_options
             WHERE question_id = $1
             ORDER BY option_index ASC`,
            [question.id]
          );

          return {
            ...question,
            options: optionsResult.rows,
          };
        }

        return question;
      })
    );

    return questions;
  }

  /**
   * Delete all questions for an exam (used before re-saving edited questions)
   */
  async deleteExamQuestions(examId: string) {
    // Options will be deleted automatically by CASCADE
    await pool.query('DELETE FROM questions WHERE exam_id = $1', [examId]);
    return { success: true };
  }

  /**
   * Delete an exam (CASCADE deletes questions, sessions, responses, violations, etc.)
   */
  async deleteExam(examId: string) {
    // Check if exam exists
    const examResult = await pool.query('SELECT id, title FROM exams WHERE id = $1', [examId]);
    if (examResult.rows.length === 0) {
      throw new Error('EXAM_NOT_FOUND');
    }

    const exam = examResult.rows[0];

    // Check if there are any completed sessions for this exam
    const sessionsResult = await pool.query(
      'SELECT COUNT(*) as count FROM exam_sessions WHERE exam_id = $1 AND status = $2',
      [examId, 'completed']
    );

    const completedSessionsCount = parseInt(sessionsResult.rows[0].count);

    // Delete the exam (CASCADE will delete all related data)
    await pool.query('DELETE FROM exams WHERE id = $1', [examId]);

    return {
      success: true,
      examTitle: exam.title,
      completedSessionsCount,
    };
  }

  /**
   * Get exam report - all students and their responses for a specific exam
   */
  async getExamReport(examId: string) {
    // Verify exam exists
    const examResult = await pool.query(
      'SELECT id, title, version, duration_minutes FROM exams WHERE id = $1',
      [examId]
    );

    if (examResult.rows.length === 0) {
      throw new Error('EXAM_NOT_FOUND');
    }

    const exam = examResult.rows[0];

    // Get all questions for this exam
    const questionsResult = await pool.query(
      `SELECT id, question_number, question_text, question_type, image_url
       FROM questions
       WHERE exam_id = $1
       ORDER BY question_number`,
      [examId]
    );

    const questions = questionsResult.rows;

    // Get all sessions for this exam
    const sessionsResult = await pool.query(
      `SELECT
        es.id as session_id,
        es.session_id as session_code,
        es.start_time,
        es.end_time,
        es.status,
        es.total_violations,
        es.score,
        s.id as student_id,
        s.full_name as student_name,
        s.email as student_email
       FROM exam_sessions es
       JOIN students s ON es.student_id = s.id
       WHERE es.exam_id = $1
       ORDER BY s.full_name, es.start_time`,
      [examId]
    );

    // For each session, get all responses
    const students = await Promise.all(
      sessionsResult.rows.map(async (session) => {
        const responsesResult = await pool.query(
          `SELECT
            r.question_id,
            r.response_text,
            r.response_option_index,
            r.is_correct,
            r.answered_at
           FROM responses r
           WHERE r.session_id = $1`,
          [session.session_id]
        );

        // Create a map of question_id -> response
        const responsesMap = new Map();
        responsesResult.rows.forEach((r) => {
          responsesMap.set(r.question_id, r);
        });

        // Build responses array in question order
        const responses = questions.map((q) => {
          const response = responsesMap.get(q.id);
          if (!response) {
            return null; // No answer for this question
          }

          if (q.question_type === 'multiple-choice') {
            return {
              questionId: q.id,
              responseOptionIndex: response.response_option_index,
              isCorrect: response.is_correct,
              answeredAt: response.answered_at,
            };
          }

          return {
            questionId: q.id,
            responseText: response.response_text,
            answeredAt: response.answered_at,
          };
        });

        return {
          studentId: session.student_id,
          studentName: session.student_name,
          studentEmail: session.student_email,
          sessionId: session.session_id,
          submissionTime: session.end_time || session.start_time,
          status: session.status,
          totalViolations: session.total_violations,
          score: session.score,
          responses,
        };
      })
    );

    // Get cell colors for this exam (table may not exist if migration not run)
    let colors: { session_id: string; question_id: string; color: string }[] = [];
    try {
      const colorsResult = await pool.query(
        `SELECT session_id, question_id, color
         FROM exam_report_cell_colors
         WHERE exam_id = $1`,
        [examId]
      );
      colors = colorsResult.rows;
    } catch (colorsError: any) {
      // Table might not exist on Railway if migration wasn't run
      if (colorsError?.code === '42P01') {
        console.warn('exam_report_cell_colors table not found; run database-migration-exam-report-colors-use-session-id.sql for color coding');
      } else {
        console.error('Error fetching exam report cell colors:', colorsError);
      }
    }

    return {
      exam,
      questions,
      students,
      colors,
    };
  }

  /**
   * Save cell color for exam report
   */
  async saveExamReportCellColor(examId: string, sessionId: string, questionId: string, color: string) {
    try {
      await pool.query(
        `INSERT INTO exam_report_cell_colors (exam_id, session_id, question_id, color)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (exam_id, session_id, question_id)
         DO UPDATE SET color = $4, updated_at = CURRENT_TIMESTAMP`,
        [examId, sessionId, questionId, color]
      );
    } catch (err: any) {
      if (err?.code === '42P01') {
        throw new Error('REPORT_COLORS_TABLE_MISSING');
      }
      throw err;
    }
    return { success: true };
  }

  /**
   * Save or update a note for a question response in a session
   */
  async saveSessionQuestionNote(sessionId: string, questionId: string, note: string, adminId: string) {
    // Check if note already exists
    const existingNote = await pool.query(
      `SELECT id FROM session_question_notes WHERE session_id = $1 AND question_id = $2`,
      [sessionId, questionId]
    );

    if (existingNote.rows.length > 0) {
      // Update existing note
      await pool.query(
        `UPDATE session_question_notes
         SET note = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
         WHERE session_id = $3 AND question_id = $4`,
        [note, adminId, sessionId, questionId]
      );
    } else {
      // Insert new note
      await pool.query(
        `INSERT INTO session_question_notes (session_id, question_id, note, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $4)`,
        [sessionId, questionId, note, adminId]
      );
    }

    return { success: true };
  }

  /**
   * Delete a note for a question response
   */
  async deleteSessionQuestionNote(sessionId: string, questionId: string) {
    await pool.query(
      `DELETE FROM session_question_notes WHERE session_id = $1 AND question_id = $2`,
      [sessionId, questionId]
    );

    return { success: true };
  }

  /**
   * Get cell colors for an exam report
   */
  async getExamReportCellColors(examId: string) {
    try {
      const result = await pool.query(
        `SELECT session_id, question_id, color
         FROM exam_report_cell_colors
         WHERE exam_id = $1`,
        [examId]
      );
      return result.rows;
    } catch (err: any) {
      if (err?.code === '42P01') {
        return [];
      }
      throw err;
    }
  }

  /**
   * Delete cell color
   */
  async deleteExamReportCellColor(examId: string, sessionId: string, questionId: string) {
    try {
      await pool.query(
        `DELETE FROM exam_report_cell_colors
         WHERE exam_id = $1 AND session_id = $2 AND question_id = $3`,
        [examId, sessionId, questionId]
      );
    } catch (err: any) {
      if (err?.code === '42P01') {
        throw new Error('REPORT_COLORS_TABLE_MISSING');
      }
      throw err;
    }
    return { success: true };
  }

  /**
   * Get auto-saved snapshots for an exam (for data recovery purposes)
   */
  async getExamSnapshots(examId: string) {
    const result = await pool.query(
      `SELECT
        ss.id,
        ss.session_id,
        ss.snapshot_data,
        ss.responses_count,
        ss.violations_count,
        ss.completion_percentage,
        ss.created_at,
        es.student_id,
        es.status as session_status,
        s.email as student_email,
        s.full_name as student_name,
        e.title as exam_title
      FROM session_snapshots ss
      JOIN exam_sessions es ON ss.session_id = es.id
      JOIN students s ON es.student_id = s.id
      JOIN exams e ON es.exam_id = e.id
      WHERE es.exam_id = $1
      ORDER BY ss.created_at DESC`,
      [examId]
    );

    return {
      snapshots: result.rows,
      count: result.rows.length,
    };
  }

  /**
   * Get latest snapshot for each session of an exam
   */
  async getExamLatestSnapshots(examId: string) {
    const result = await pool.query(
      `SELECT DISTINCT ON (ss.session_id)
        ss.id,
        ss.session_id,
        ss.snapshot_data,
        ss.responses_count,
        ss.violations_count,
        ss.completion_percentage,
        ss.created_at,
        es.student_id,
        es.status as session_status,
        s.email as student_email,
        s.full_name as student_name,
        e.title as exam_title
      FROM session_snapshots ss
      JOIN exam_sessions es ON ss.session_id = es.id
      JOIN students s ON es.student_id = s.id
      JOIN exams e ON es.exam_id = e.id
      WHERE es.exam_id = $1
      ORDER BY ss.session_id, ss.created_at DESC`,
      [examId]
    );

    return {
      snapshots: result.rows,
      count: result.rows.length,
    };
  }

  /**
   * Clear all snapshots for an exam
   */
  async clearExamSnapshots(examId: string) {
    const result = await pool.query(
      `DELETE FROM session_snapshots ss
       USING exam_sessions es
       WHERE ss.session_id = es.id
       AND es.exam_id = $1
       RETURNING ss.id`,
      [examId]
    );

    return {
      success: true,
      deletedCount: result.rowCount || 0,
    };
  }

  /**
   * Clear snapshots for a specific session
   */
  async clearSessionSnapshots(sessionId: string) {
    const result = await pool.query(
      `DELETE FROM session_snapshots WHERE session_id = $1 RETURNING id`,
      [sessionId]
    );

    return {
      success: true,
      deletedCount: result.rowCount || 0,
    };
  }
}

export const adminService = new AdminService();
