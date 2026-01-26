"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.violationService = exports.ViolationService = void 0;
const database_1 = require("../config/database");
class ViolationService {
    /**
     * Log a proctoring violation
     */
    async logViolation(data) {
        const client = await (0, database_1.getClient)();
        try {
            await client.query('BEGIN');
            // Determine severity if not provided
            const severity = data.severity || this.determineSeverity(data.violationType);
            // Insert violation
            const violationResult = await client.query(`INSERT INTO violations (
          session_id, violation_type, severity,
          description, browser_info, device_info, additional_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, detected_at`, [
                data.sessionId,
                data.violationType,
                severity,
                data.description || '',
                data.browserInfo || '',
                data.deviceInfo || '',
                JSON.stringify(data.additionalData || {}),
            ]);
            // Update session violation count
            const sessionResult = await client.query(`UPDATE exam_sessions
         SET total_violations = total_violations + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING total_violations, (
           SELECT max_violations FROM exams WHERE id = exam_sessions.exam_id
         ) as max_violations`, [data.sessionId]);
            await client.query('COMMIT');
            const { total_violations, max_violations } = sessionResult.rows[0];
            const shouldTerminate = total_violations >= max_violations;
            console.log(`⚠️  Violation logged:`, {
                type: data.violationType,
                severity,
                count: total_violations,
                max: max_violations,
                shouldTerminate,
            });
            return {
                violationId: violationResult.rows[0].id,
                detectedAt: violationResult.rows[0].detected_at,
                totalViolations: total_violations,
                shouldTerminate,
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Error logging violation:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get all violations for a session
     */
    async getSessionViolations(sessionId) {
        const result = await database_1.pool.query(`SELECT * FROM violations
       WHERE session_id = $1
       ORDER BY detected_at ASC`, [sessionId]);
        return result.rows;
    }
    /**
     * Get violation statistics for a session
     */
    async getViolationStats(sessionId) {
        const result = await database_1.pool.query(`SELECT
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
        COUNT(*) FILTER (WHERE severity = 'high') as high_count,
        COUNT(*) FILTER (WHERE severity = 'medium') as medium_count,
        COUNT(*) FILTER (WHERE severity = 'low') as low_count,
        ARRAY_AGG(DISTINCT violation_type) as types
       FROM violations
       WHERE session_id = $1`, [sessionId]);
        return result.rows[0];
    }
    /**
     * Determine violation severity based on type
     */
    determineSeverity(violationType) {
        const type = violationType.toLowerCase();
        // Critical violations
        if (type.includes('developer tools') ||
            type.includes('console') ||
            type.includes('exam terminated') ||
            type.includes('multiple violations')) {
            return 'critical';
        }
        // High severity
        if (type.includes('paste') ||
            type.includes('copy') ||
            type.includes('right-click') ||
            type.includes('view source')) {
            return 'high';
        }
        // Medium severity
        if (type.includes('tab') || type.includes('window') || type.includes('focus')) {
            return 'medium';
        }
        // Default to low
        return 'low';
    }
    /**
     * Check if violation is serious enough to send alert
     */
    isSeriousViolation(violationType) {
        const severity = this.determineSeverity(violationType);
        return severity === 'critical' || severity === 'high';
    }
}
exports.ViolationService = ViolationService;
exports.violationService = new ViolationService();
//# sourceMappingURL=violation.service.js.map