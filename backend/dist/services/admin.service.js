"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = exports.AdminService = void 0;
const database_1 = require("../config/database");
class AdminService {
    /**
     * Get all sessions with filtering, sorting, and pagination
     */
    async getSessions(filters) {
        const { status = 'all', examId, studentEmail, startDate, endDate, page = 1, limit = 50, sortBy = 'start_time', sortOrder = 'desc', } = filters;
        // Build WHERE clause
        const conditions = [];
        const params = [];
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
        const countResult = await database_1.pool.query(`SELECT COUNT(*) as total
       FROM exam_sessions es
       JOIN students s ON es.student_id = s.id
       JOIN exams e ON es.exam_id = e.id
       ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        // Get sessions
        paramCount++;
        const limitParam = paramCount;
        paramCount++;
        const offsetParam = paramCount;
        const sessionsResult = await database_1.pool.query(`SELECT
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
       LIMIT $${limitParam} OFFSET $${offsetParam}`, [...params, limit, offset]);
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
    async getSessionDetails(sessionId) {
        console.log('[AdminService] getSessionDetails called with sessionId:', sessionId);
        // Get session info
        const sessionResult = await database_1.pool.query(`SELECT
        es.*,
        s.email as student_email,
        s.full_name as student_name,
        e.title as exam_title,
        e.version as exam_version,
        e.duration_minutes
       FROM exam_sessions es
       JOIN students s ON es.student_id = s.id
       JOIN exams e ON es.exam_id = e.id
       WHERE es.id = $1`, [sessionId]);
        if (sessionResult.rows.length === 0) {
            throw new Error('SESSION_NOT_FOUND');
        }
        const session = sessionResult.rows[0];
        console.log('[AdminService] Found session:', { id: session.id, session_id: session.session_id, student: session.student_name });
        // Get all responses with questions
        const responsesResult = await database_1.pool.query(`SELECT
        r.*,
        q.question_number,
        q.question_text,
        q.question_type,
        q.image_url
       FROM responses r
       JOIN questions q ON r.question_id = q.id
       WHERE r.session_id = $1
       ORDER BY q.question_number`, [session.id]);
        console.log('[AdminService] Found responses:', responsesResult.rows.length);
        // Get violations
        const violationsResult = await database_1.pool.query(`SELECT violation_type, severity, description, detected_at, browser_info
       FROM violations
       WHERE session_id = $1
       ORDER BY detected_at`, [session.id]);
        // Get notes for each question
        const notesResult = await database_1.pool.query(`SELECT question_id, note, created_by, created_at, updated_by, updated_at
       FROM session_question_notes
       WHERE session_id = $1`, [session.id]);
        // Create a map of question_id -> note
        const notesMap = new Map();
        notesResult.rows.forEach((noteRow) => {
            notesMap.set(noteRow.question_id, {
                note: noteRow.note,
                createdBy: noteRow.created_by,
                createdAt: noteRow.created_at,
                updatedBy: noteRow.updated_by,
                updatedAt: noteRow.updated_at,
            });
        });
        // Add notes to responses
        const responsesWithNotes = await Promise.all(responsesResult.rows.map(async (response) => {
            const note = notesMap.get(response.question_id);
            if (response.question_type === 'multiple-choice') {
                const optionsResult = await database_1.pool.query(`SELECT option_index, option_text, is_correct
             FROM question_options
             WHERE question_id = $1
             ORDER BY option_index`, [response.question_id]);
                const options = optionsResult.rows;
                const selectedOption = response.response_option_index !== null ? options[response.response_option_index] : null;
                const correctAnswer = options.find((o) => o.is_correct);
                return {
                    questionId: response.question_id,
                    questionNumber: response.question_number,
                    questionText: response.question_text,
                    questionType: response.question_type,
                    imageUrl: response.image_url,
                    options: options.map((o) => o.option_text),
                    selectedOptionIndex: response.response_option_index,
                    selectedOption: selectedOption?.option_text || null,
                    correctAnswer: correctAnswer?.option_text || null,
                    isCorrect: response.is_correct,
                    answeredAt: response.answered_at,
                    note: note?.note || null,
                };
            }
            return {
                questionId: response.question_id,
                questionNumber: response.question_number,
                questionText: response.question_text,
                questionType: response.question_type,
                imageUrl: response.image_url,
                responseText: response.response_text,
                answeredAt: response.answered_at,
                note: note?.note || null,
            };
        }));
        console.log('[AdminService] Found violations:', violationsResult.rows.length);
        console.log('[AdminService] Found notes:', notesResult.rows.length);
        console.log('[AdminService] Returning data:', {
            hasSession: !!session,
            responsesCount: responsesWithNotes.length,
            violationsCount: violationsResult.rows.length,
            notesCount: notesResult.rows.length
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
        const totalResult = await database_1.pool.query('SELECT COUNT(*) as count FROM exam_sessions');
        // Active sessions
        const activeResult = await database_1.pool.query("SELECT COUNT(*) as count FROM exam_sessions WHERE status = 'in_progress'");
        // Completed sessions
        const completedResult = await database_1.pool.query("SELECT COUNT(*) as count FROM exam_sessions WHERE status = 'completed'");
        // Completed today
        const completedTodayResult = await database_1.pool.query(`SELECT COUNT(*) as count FROM exam_sessions
       WHERE status = 'completed' AND DATE(end_time) = CURRENT_DATE`);
        // Total students
        const studentsResult = await database_1.pool.query('SELECT COUNT(*) as count FROM students WHERE is_authorized = true');
        // Total exams
        const examsResult = await database_1.pool.query('SELECT COUNT(*) as count FROM exams');
        // Average completion rate
        const avgCompletionResult = await database_1.pool.query('SELECT AVG(completion_percentage) as avg FROM exam_sessions WHERE completion_percentage IS NOT NULL');
        // Average violations
        const avgViolationsResult = await database_1.pool.query('SELECT AVG(total_violations) as avg FROM exam_sessions');
        // Average score
        const avgScoreResult = await database_1.pool.query('SELECT AVG(score) as avg FROM exam_sessions WHERE score IS NOT NULL');
        // Flagged sessions
        const flaggedResult = await database_1.pool.query("SELECT COUNT(*) as count FROM proctoring_reports WHERE status = 'flagged_for_review'");
        // Recent sessions
        const recentResult = await database_1.pool.query(`SELECT
        es.session_id,
        es.start_time,
        es.status,
        s.full_name as student_name,
        e.title as exam_title
       FROM exam_sessions es
       JOIN students s ON es.student_id = s.id
       JOIN exams e ON es.exam_id = e.id
       ORDER BY es.start_time DESC
       LIMIT 10`);
        // Violation trends
        const violationTrendsResult = await database_1.pool.query(`SELECT violation_type, COUNT(*) as count
       FROM violations
       GROUP BY violation_type
       ORDER BY count DESC
       LIMIT 10`);
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
    async exportSessions(filters) {
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
    async addAuthorizedStudent(email, fullName) {
        const result = await database_1.pool.query(`INSERT INTO students (email, full_name, is_authorized)
       VALUES ($1, $2, true)
       ON CONFLICT (email) DO UPDATE SET
         is_authorized = true,
         full_name = COALESCE(EXCLUDED.full_name, students.full_name),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`, [email, fullName || null]);
        return result.rows[0];
    }
    /**
     * Remove student authorization
     */
    async removeAuthorizedStudent(email) {
        const result = await database_1.pool.query(`UPDATE students
       SET is_authorized = false,
           updated_at = CURRENT_TIMESTAMP
       WHERE LOWER(email) = LOWER($1)
       RETURNING *`, [email]);
        return result.rows[0];
    }
    /**
     * Bulk add students from CSV data
     */
    async bulkAddStudents(students) {
        const client = await (0, database_1.getClient)();
        try {
            await client.query('BEGIN');
            const results = [];
            for (const student of students) {
                const result = await client.query(`INSERT INTO students (email, full_name, is_authorized)
           VALUES ($1, $2, true)
           ON CONFLICT (email) DO UPDATE SET
             is_authorized = true,
             full_name = EXCLUDED.full_name,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`, [student.email, student.fullName]);
                results.push(result.rows[0]);
            }
            await client.query('COMMIT');
            console.log(`✅ Bulk added ${results.length} students`);
            return results;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get all authorized students
     */
    async getAuthorizedStudents() {
        const result = await database_1.pool.query(`SELECT id, email, full_name, last_login, created_at
       FROM students
       WHERE is_authorized = true
       ORDER BY full_name`);
        return result.rows;
    }
    /**
     * Create new exam
     */
    async createExam(data) {
        const result = await database_1.pool.query(`INSERT INTO exams (
        title, description, version, duration_minutes, max_violations, is_active
      ) VALUES ($1, $2, $3, $4, $5, false)
      RETURNING *`, [data.title, data.description, data.version, data.durationMinutes, data.maxViolations || 7]);
        return result.rows[0];
    }
    /**
     * Add question to exam
     */
    async addQuestion(data) {
        const client = await (0, database_1.getClient)();
        try {
            await client.query('BEGIN');
            // Get the next available question number if not provided or if conflict exists
            let questionNumber = data.questionNumber;
            const maxQuestionResult = await client.query(`SELECT COALESCE(MAX(question_number), 0) as max_num
         FROM questions
         WHERE exam_id = $1`, [data.examId]);
            const nextAvailableNumber = maxQuestionResult.rows[0].max_num + 1;
            // If the provided question number already exists, use the next available
            const existingCheck = await client.query(`SELECT id FROM questions WHERE exam_id = $1 AND question_number = $2`, [data.examId, questionNumber]);
            if (existingCheck.rows.length > 0) {
                questionNumber = nextAvailableNumber;
            }
            // Insert question
            const questionResult = await client.query(`INSERT INTO questions (
          exam_id, question_number, question_text, question_type,
          required, placeholder, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`, [
                data.examId,
                questionNumber,
                data.questionText,
                data.questionType,
                data.required || false,
                data.placeholder,
                data.imageUrl,
            ]);
            const questionId = questionResult.rows[0].id;
            // Add options for multiple-choice
            if (data.questionType === 'multiple-choice' && data.options && data.options.length > 0) {
                for (let i = 0; i < data.options.length; i++) {
                    await client.query(`INSERT INTO question_options (
              question_id, option_index, option_text, is_correct
            ) VALUES ($1, $2, $3, $4)`, [questionId, i, data.options[i], i === data.correctAnswer]);
                }
            }
            await client.query('COMMIT');
            return { questionId, success: true };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Activate/deactivate exam
     */
    async setExamActive(examId, isActive) {
        // If activating, deactivate all other exams first
        if (isActive) {
            await database_1.pool.query('UPDATE exams SET is_active = false WHERE is_active = true');
        }
        const result = await database_1.pool.query('UPDATE exams SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [isActive, examId]);
        return result.rows[0];
    }
    /**
     * Update exam
     */
    async updateExam(examId, data) {
        // Build dynamic UPDATE query based on provided fields
        const fields = [];
        const values = [];
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
        const result = await database_1.pool.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('Exam not found');
        }
        return result.rows[0];
    }
    /**
     * Get all exams
     */
    async getExams() {
        const result = await database_1.pool.query(`SELECT
        e.*,
        COUNT(q.id) as question_count
       FROM exams e
       LEFT JOIN questions q ON q.exam_id = e.id
       GROUP BY e.id
       ORDER BY e.created_at DESC`);
        return result.rows;
    }
    /**
     * Get exam by ID
     */
    async getExamById(examId) {
        const result = await database_1.pool.query(`SELECT
        e.*,
        COUNT(q.id) as question_count
       FROM exams e
       LEFT JOIN questions q ON q.exam_id = e.id
       WHERE e.id = $1
       GROUP BY e.id`, [examId]);
        if (result.rows.length === 0) {
            throw new Error('Exam not found');
        }
        return result.rows[0];
    }
    /**
     * Get questions for an exam
     */
    async getExamQuestions(examId) {
        // Get all questions for the exam
        const questionsResult = await database_1.pool.query(`SELECT
        id, exam_id, question_number, question_text, question_type,
        required, placeholder, image_url
       FROM questions
       WHERE exam_id = $1
       ORDER BY question_number ASC`, [examId]);
        // Enrich multiple-choice questions with options
        const questions = await Promise.all(questionsResult.rows.map(async (question) => {
            if (question.question_type === 'multiple-choice') {
                const optionsResult = await database_1.pool.query(`SELECT option_index, option_text, is_correct
             FROM question_options
             WHERE question_id = $1
             ORDER BY option_index ASC`, [question.id]);
                return {
                    ...question,
                    options: optionsResult.rows,
                };
            }
            return question;
        }));
        return questions;
    }
    /**
     * Delete all questions for an exam (used before re-saving edited questions)
     */
    async deleteExamQuestions(examId) {
        // Options will be deleted automatically by CASCADE
        await database_1.pool.query('DELETE FROM questions WHERE exam_id = $1', [examId]);
        return { success: true };
    }
    /**
     * Delete an exam (CASCADE deletes questions, sessions, responses, violations, etc.)
     */
    async deleteExam(examId) {
        // Check if exam exists
        const examResult = await database_1.pool.query('SELECT id, title FROM exams WHERE id = $1', [examId]);
        if (examResult.rows.length === 0) {
            throw new Error('EXAM_NOT_FOUND');
        }
        const exam = examResult.rows[0];
        // Check if there are any completed sessions for this exam
        const sessionsResult = await database_1.pool.query('SELECT COUNT(*) as count FROM exam_sessions WHERE exam_id = $1 AND status = $2', [examId, 'completed']);
        const completedSessionsCount = parseInt(sessionsResult.rows[0].count);
        // Delete the exam (CASCADE will delete all related data)
        await database_1.pool.query('DELETE FROM exams WHERE id = $1', [examId]);
        return {
            success: true,
            examTitle: exam.title,
            completedSessionsCount,
        };
    }
    /**
     * Get exam report - all students and their responses for a specific exam
     */
    async getExamReport(examId) {
        // Verify exam exists
        const examResult = await database_1.pool.query('SELECT id, title, version, duration_minutes FROM exams WHERE id = $1', [examId]);
        if (examResult.rows.length === 0) {
            throw new Error('EXAM_NOT_FOUND');
        }
        const exam = examResult.rows[0];
        // Get all questions for this exam
        const questionsResult = await database_1.pool.query(`SELECT id, question_number, question_text, question_type, image_url
       FROM questions
       WHERE exam_id = $1
       ORDER BY question_number`, [examId]);
        const questions = questionsResult.rows;
        // Get all sessions for this exam
        const sessionsResult = await database_1.pool.query(`SELECT
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
       ORDER BY s.full_name, es.start_time`, [examId]);
        // For each session, get all responses
        const students = await Promise.all(sessionsResult.rows.map(async (session) => {
            const responsesResult = await database_1.pool.query(`SELECT
            r.question_id,
            r.response_text,
            r.response_option_index,
            r.is_correct,
            r.answered_at
           FROM responses r
           WHERE r.session_id = $1`, [session.session_id]);
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
        }));
        // Get cell colors for this exam
        const colorsResult = await database_1.pool.query(`SELECT session_id, question_id, color
       FROM exam_report_cell_colors
       WHERE exam_id = $1`, [examId]);
        const colors = colorsResult.rows;
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
    async saveExamReportCellColor(examId, sessionId, questionId, color) {
        // Upsert the color
        await database_1.pool.query(`INSERT INTO exam_report_cell_colors (exam_id, session_id, question_id, color)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (exam_id, session_id, question_id)
       DO UPDATE SET color = $4, updated_at = CURRENT_TIMESTAMP`, [examId, sessionId, questionId, color]);
        return { success: true };
    }
    /**
     * Save or update a note for a question response in a session
     */
    async saveSessionQuestionNote(sessionId, questionId, note, adminId) {
        // Check if note already exists
        const existingNote = await database_1.pool.query(`SELECT id FROM session_question_notes WHERE session_id = $1 AND question_id = $2`, [sessionId, questionId]);
        if (existingNote.rows.length > 0) {
            // Update existing note
            await database_1.pool.query(`UPDATE session_question_notes
         SET note = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
         WHERE session_id = $3 AND question_id = $4`, [note, adminId, sessionId, questionId]);
        }
        else {
            // Insert new note
            await database_1.pool.query(`INSERT INTO session_question_notes (session_id, question_id, note, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $4)`, [sessionId, questionId, note, adminId]);
        }
        return { success: true };
    }
    /**
     * Delete a note for a question response
     */
    async deleteSessionQuestionNote(sessionId, questionId) {
        await database_1.pool.query(`DELETE FROM session_question_notes WHERE session_id = $1 AND question_id = $2`, [sessionId, questionId]);
        return { success: true };
    }
    /**
     * Get cell colors for an exam report
     */
    async getExamReportCellColors(examId) {
        const result = await database_1.pool.query(`SELECT session_id, question_id, color
       FROM exam_report_cell_colors
       WHERE exam_id = $1`, [examId]);
        return result.rows;
    }
    /**
     * Delete cell color
     */
    async deleteExamReportCellColor(examId, sessionId, questionId) {
        await database_1.pool.query(`DELETE FROM exam_report_cell_colors
       WHERE exam_id = $1 AND session_id = $2 AND question_id = $3`, [examId, sessionId, questionId]);
        return { success: true };
    }
}
exports.AdminService = AdminService;
exports.adminService = new AdminService();
//# sourceMappingURL=admin.service.js.map