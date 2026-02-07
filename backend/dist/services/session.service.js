"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = exports.SessionService = void 0;
const database_1 = require("../config/database");
const studentGroup_service_1 = require("./studentGroup.service");
class SessionService {
    /**
     * Create a new exam session for a student
     */
    async createSession(data) {
        // Enforce group-based access before creating session
        const canAccess = await studentGroup_service_1.studentGroupService.canStudentAccessExam(data.studentId, data.examId);
        if (!canAccess) {
            throw new Error('ACCESS_DENIED_TO_EXAM');
        }
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const client = await (0, database_1.getClient)();
        try {
            await client.query('BEGIN');
            // Get exam duration
            const examResult = await client.query('SELECT duration_minutes FROM exams WHERE id = $1 AND is_active = true', [data.examId]);
            if (examResult.rows.length === 0) {
                throw new Error('Exam not found or not active');
            }
            const durationMs = examResult.rows[0].duration_minutes * 60 * 1000;
            const scheduledEndTime = new Date(Date.now() + durationMs);
            // Create session
            const result = await client.query(`INSERT INTO exam_sessions (
          session_id, student_id, exam_id,
          scheduled_end_time, browser_info, ip_address, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'in_progress')
        RETURNING *`, [sessionId, data.studentId, data.examId, scheduledEndTime, data.browserInfo, data.ipAddress]);
            // Log session start as a violation event
            await client.query(`INSERT INTO violations (
          session_id, violation_type, severity, description, browser_info
        ) VALUES ($1, 'Exam started', 'low', 'Student initiated exam session', $2)`, [result.rows[0].id, data.browserInfo]);
            await client.query('COMMIT');
            return result.rows[0];
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating session:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get session by ID
     */
    async getSessionById(sessionId) {
        const result = await database_1.pool.query(`SELECT
        es.*,
        s.email as student_email,
        s.full_name as student_name,
        e.title as exam_title,
        e.duration_minutes,
        e.max_violations
      FROM exam_sessions es
      JOIN students s ON es.student_id = s.id
      JOIN exams e ON es.exam_id = e.id
      WHERE es.id = $1`, [sessionId]);
        return result.rows[0] || null;
    }
    /**
     * Get session by session code
     */
    async getSessionByCode(sessionCode) {
        const result = await database_1.pool.query(`SELECT
        es.*,
        e.duration_minutes,
        e.max_violations
      FROM exam_sessions es
      JOIN exams e ON es.exam_id = e.id
      WHERE es.session_id = $1`, [sessionCode]);
        return result.rows[0] || null;
    }
    /**
     * Save progress snapshot for recovery
     */
    async saveSnapshot(sessionId, snapshotData) {
        const result = await database_1.pool.query(`INSERT INTO session_snapshots (
        session_id, snapshot_data, responses_count,
        violations_count, completion_percentage
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at`, [
            sessionId,
            JSON.stringify(snapshotData),
            Object.keys(snapshotData.responses || {}).length,
            snapshotData.violations || 0,
            snapshotData.completionPercentage || 0,
        ]);
        console.log(`✅ Snapshot saved for session ${sessionId}:`, {
            responses: Object.keys(snapshotData.responses || {}).length,
            violations: snapshotData.violations,
        });
        return result.rows[0];
    }
    /**
     * Get latest snapshot for recovery
     */
    async getLatestSnapshot(sessionId) {
        const result = await database_1.pool.query(`SELECT * FROM session_snapshots
       WHERE session_id = $1
       ORDER BY created_at DESC
       LIMIT 1`, [sessionId]);
        return result.rows[0] || null;
    }
    /**
     * Update session completion percentage
     */
    async updateSessionStats(sessionId) {
        const client = await (0, database_1.getClient)();
        try {
            await client.query('BEGIN');
            // Update completion percentage
            await client.query(`UPDATE exam_sessions
         SET completion_percentage = (
           SELECT ROUND((COUNT(*)::DECIMAL / (
             SELECT COUNT(*) FROM questions WHERE exam_id = exam_sessions.exam_id
           )) * 100, 2)
           FROM responses
           WHERE session_id = $1
         ),
         total_violations = (
           SELECT COUNT(*)
           FROM violations
           WHERE session_id = $1
         ),
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [sessionId]);
            await client.query('COMMIT');
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
     * Complete exam session
     */
    async completeSession(sessionId, submissionType) {
        const client = await (0, database_1.getClient)();
        // Map frontend submission types to DB enum (schema: manual, auto_timeout, max_violations, admin_terminated)
        const dbSubmissionType = submissionType === 'auto_time_expired'
            ? 'auto_timeout'
            : submissionType === 'auto_violations'
                ? 'max_violations'
                : submissionType;
        try {
            await client.query('BEGIN');
            const endTime = new Date();
            // Update session
            const result = await client.query(`UPDATE exam_sessions
         SET
           end_time = $1,
           status = 'completed',
           submission_type = $2,
           actual_duration_seconds = EXTRACT(EPOCH FROM ($1 - start_time)),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`, [endTime, dbSubmissionType, sessionId]);
            if (result.rows.length === 0) {
                throw new Error('Session not found');
            }
            const session = result.rows[0];
            // Calculate score - with fallback if database function doesn't exist
            let score = 0;
            try {
                const scoreResult = await client.query('SELECT calculate_session_score($1) as score', [sessionId]);
                score = scoreResult.rows[0].score || 0;
            }
            catch (scoreError) {
                // If the function doesn't exist, calculate manually
                console.warn('calculate_session_score function not available, calculating manually:', scoreError.message);
                // Manual score calculation
                const responsesResult = await client.query(`SELECT 
            COUNT(*) as total_questions,
            COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_answers
          FROM responses
          WHERE session_id = $1`, [sessionId]);
                const { total_questions, correct_answers } = responsesResult.rows[0];
                if (parseInt(total_questions) > 0) {
                    score = (parseInt(correct_answers) / parseInt(total_questions)) * 100;
                    score = Math.round(score * 100) / 100; // Round to 2 decimal places
                }
            }
            // Update session with score
            await client.query('UPDATE exam_sessions SET score = $1 WHERE id = $2', [score, sessionId]);
            // Generate proctoring report
            await this.generateProctoringReport(client, sessionId, session, score);
            await client.query('COMMIT');
            return { ...session, score };
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Error completing session:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Generate proctoring report
     */
    async generateProctoringReport(client, sessionId, session, score) {
        // Get violations
        const violationsResult = await client.query(`SELECT violation_type, severity
       FROM violations
       WHERE session_id = $1
       ORDER BY detected_at`, [sessionId]);
        const violations = violationsResult.rows;
        const violationTypes = [...new Set(violations.map((v) => v.violation_type))];
        // Determine status
        let status = 'clean';
        const seriousViolations = violations.filter((v) => v.severity === 'critical' || v.severity === 'high' || v.violation_type.toLowerCase().includes('developer tools'));
        if (seriousViolations.length > 0) {
            status = 'flagged_for_review';
        }
        else if (session.total_violations === 0) {
            status = 'clean';
        }
        else if (session.total_violations <= 2) {
            status = 'minor_issues';
        }
        else if (session.total_violations <= 5) {
            status = 'concerning';
        }
        else {
            status = 'flagged_for_review';
        }
        // Get student and exam details
        const detailsResult = await client.query(`SELECT
        s.full_name as student_name,
        s.email as student_email,
        e.title as exam_title
       FROM exam_sessions es
       JOIN students s ON es.student_id = s.id
       JOIN exams e ON es.exam_id = e.id
       WHERE es.id = $1`, [sessionId]);
        const details = detailsResult.rows[0];
        // Insert report
        await client.query(`INSERT INTO proctoring_reports (
        session_id, student_id, exam_id,
        student_name, student_email, exam_title,
        exam_start, exam_end, duration_minutes,
        total_violations, violation_types, status,
        form_submitted, score, completion_percentage
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, $14)`, [
            sessionId,
            session.student_id,
            session.exam_id,
            details.student_name,
            details.student_email,
            details.exam_title,
            session.start_time,
            session.end_time,
            Math.round(session.actual_duration_seconds / 60),
            session.total_violations,
            violationTypes,
            status,
            score,
            session.completion_percentage,
        ]);
    }
    /**
     * Check if session should be terminated due to violations
     */
    async checkViolationLimit(sessionId) {
        const result = await database_1.pool.query(`SELECT
        es.total_violations,
        e.max_violations
       FROM exam_sessions es
       JOIN exams e ON es.exam_id = e.id
       WHERE es.id = $1`, [sessionId]);
        if (result.rows.length === 0)
            return false;
        const { total_violations, max_violations } = result.rows[0];
        return total_violations >= max_violations;
    }
    /**
     * Mark session for recovery (when resumed)
     */
    async markSessionResumed(sessionId) {
        await database_1.pool.query(`UPDATE exam_sessions
       SET was_resumed = true,
           resume_count = resume_count + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`, [sessionId]);
        // Log resume event
        await database_1.pool.query(`INSERT INTO violations (
        session_id, violation_type, severity, description
      ) VALUES ($1, 'Exam resumed from URL progress', 'low', 'Student recovered and resumed exam')`, [sessionId]);
    }
    /**
     * Check if student has an existing in-progress session for an exam
     */
    async checkExistingSession(studentId, examId) {
        const result = await database_1.pool.query(`SELECT
        es.*,
        e.title as exam_title,
        e.duration_minutes,
        e.max_violations
      FROM exam_sessions es
      JOIN exams e ON es.exam_id = e.id
      WHERE es.student_id = $1
        AND es.exam_id = $2
        AND es.status = 'in_progress'
      ORDER BY es.created_at DESC
      LIMIT 1`, [studentId, examId]);
        return result.rows[0] || null;
    }
    /**
     * Get recovery data for a session (latest snapshot + session info)
     */
    async getRecoveryData(sessionId) {
        const session = await this.getSessionById(sessionId);
        if (!session || session.status !== 'in_progress') {
            return null;
        }
        const snapshot = await this.getLatestSnapshot(sessionId);
        if (!snapshot) {
            return null;
        }
        return {
            session: {
                id: session.id,
                sessionCode: session.session_code,
                examId: session.exam_id,
                examTitle: session.exam_title,
                startTime: session.start_time,
                durationMinutes: session.duration_minutes,
                maxViolations: session.max_violations,
                violationsCount: session.violations_count,
            },
            snapshot: snapshot.snapshot_data,
            canRecover: true,
        };
    }
}
exports.SessionService = SessionService;
exports.sessionService = new SessionService();
//# sourceMappingURL=session.service.js.map