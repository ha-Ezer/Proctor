"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentGroupService = exports.StudentGroupService = void 0;
const database_1 = require("../config/database");
class StudentGroupService {
    /**
     * Get all student groups with stats
     */
    async getGroups() {
        const result = await database_1.pool.query(`
      SELECT
        id,
        name,
        description,
        member_count,
        exam_count,
        created_at
      FROM v_group_stats
      ORDER BY name
    `);
        return result.rows;
    }
    /**
     * Get a single group by ID
     */
    async getGroupById(groupId) {
        const result = await database_1.pool.query(`SELECT
        g.*,
        (SELECT COUNT(*) FROM student_group_members WHERE group_id = g.id) as member_count,
        (SELECT COUNT(*) FROM exam_group_access WHERE group_id = g.id) as exam_count
      FROM student_groups g
      WHERE g.id = $1`, [groupId]);
        if (result.rows.length === 0) {
            throw new Error('GROUP_NOT_FOUND');
        }
        return result.rows[0];
    }
    /**
     * Create a new student group
     */
    async createGroup(data) {
        // Check if name already exists
        const existingResult = await database_1.pool.query('SELECT id FROM student_groups WHERE LOWER(name) = LOWER($1)', [
            data.name,
        ]);
        if (existingResult.rows.length > 0) {
            throw new Error('GROUP_NAME_EXISTS');
        }
        const result = await database_1.pool.query(`INSERT INTO student_groups (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`, [data.name, data.description || null, data.createdBy || null]);
        return result.rows[0];
    }
    /**
     * Update group details
     */
    async updateGroup(groupId, data) {
        const updates = [];
        const params = [];
        let paramCount = 0;
        if (data.name !== undefined) {
            paramCount++;
            updates.push(`name = $${paramCount}`);
            params.push(data.name);
        }
        if (data.description !== undefined) {
            paramCount++;
            updates.push(`description = $${paramCount}`);
            params.push(data.description);
        }
        if (updates.length === 0) {
            throw new Error('NO_UPDATES_PROVIDED');
        }
        paramCount++;
        params.push(groupId);
        const result = await database_1.pool.query(`UPDATE student_groups
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`, params);
        if (result.rows.length === 0) {
            throw new Error('GROUP_NOT_FOUND');
        }
        return result.rows[0];
    }
    /**
     * Delete a student group
     */
    async deleteGroup(groupId) {
        const result = await database_1.pool.query('DELETE FROM student_groups WHERE id = $1 RETURNING name', [groupId]);
        if (result.rows.length === 0) {
            throw new Error('GROUP_NOT_FOUND');
        }
        return { success: true, groupName: result.rows[0].name };
    }
    /**
     * Add student to group
     */
    async addStudentToGroup(groupId, studentId, addedBy) {
        try {
            const result = await database_1.pool.query(`INSERT INTO student_group_members (group_id, student_id, added_by)
         VALUES ($1, $2, $3)
         RETURNING *`, [groupId, studentId, addedBy || null]);
            return result.rows[0];
        }
        catch (error) {
            if (error.code === '23505') {
                // Unique constraint violation
                throw new Error('STUDENT_ALREADY_IN_GROUP');
            }
            if (error.code === '23503') {
                // Foreign key violation
                throw new Error('STUDENT_OR_GROUP_NOT_FOUND');
            }
            throw error;
        }
    }
    /**
     * Add multiple students to group by email
     */
    async addStudentsByEmail(groupId, emails, addedBy) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            const added = [];
            const notFound = [];
            const alreadyInGroup = [];
            for (const email of emails) {
                // Get student ID
                const studentResult = await client.query('SELECT id FROM students WHERE LOWER(email) = LOWER($1)', [email]);
                if (studentResult.rows.length === 0) {
                    notFound.push(email);
                    continue;
                }
                const studentId = studentResult.rows[0].id;
                // Try to add to group
                try {
                    const result = await client.query(`INSERT INTO student_group_members (group_id, student_id, added_by)
             VALUES ($1, $2, $3)
             RETURNING *`, [groupId, studentId, addedBy || null]);
                    added.push({ email, ...result.rows[0] });
                }
                catch (error) {
                    if (error.code === '23505') {
                        alreadyInGroup.push(email);
                    }
                    else {
                        throw error;
                    }
                }
            }
            await client.query('COMMIT');
            return {
                added: added.length,
                notFound,
                alreadyInGroup,
                details: added,
            };
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
     * Remove student from group
     */
    async removeStudentFromGroup(groupId, studentId) {
        const result = await database_1.pool.query('DELETE FROM student_group_members WHERE group_id = $1 AND student_id = $2 RETURNING *', [groupId, studentId]);
        if (result.rows.length === 0) {
            throw new Error('STUDENT_NOT_IN_GROUP');
        }
        return { success: true };
    }
    /**
     * Get all members of a group
     */
    async getGroupMembers(groupId) {
        const result = await database_1.pool.query(`SELECT
        s.id,
        s.email,
        s.full_name,
        sgm.added_at,
        sgm.added_by
      FROM student_group_members sgm
      JOIN students s ON s.id = sgm.student_id
      WHERE sgm.group_id = $1
      ORDER BY s.full_name`, [groupId]);
        return result.rows;
    }
    /**
     * Get all groups a student belongs to
     */
    async getStudentGroups(studentId) {
        const result = await database_1.pool.query(`SELECT
        g.id,
        g.name,
        g.description,
        sgm.added_at
      FROM student_group_members sgm
      JOIN student_groups g ON g.id = sgm.group_id
      WHERE sgm.student_id = $1
      ORDER BY g.name`, [studentId]);
        return result.rows;
    }
    /**
     * Assign group to exam
     */
    async assignGroupToExam(examId, groupId, createdBy) {
        try {
            const result = await database_1.pool.query(`INSERT INTO exam_group_access (exam_id, group_id, created_by)
         VALUES ($1, $2, $3)
         RETURNING *`, [examId, groupId, createdBy || null]);
            return result.rows[0];
        }
        catch (error) {
            if (error.code === '23505') {
                throw new Error('GROUP_ALREADY_ASSIGNED');
            }
            if (error.code === '23503') {
                throw new Error('EXAM_OR_GROUP_NOT_FOUND');
            }
            throw error;
        }
    }
    /**
     * Remove group from exam
     */
    async removeGroupFromExam(examId, groupId) {
        const result = await database_1.pool.query('DELETE FROM exam_group_access WHERE exam_id = $1 AND group_id = $2 RETURNING *', [examId, groupId]);
        if (result.rows.length === 0) {
            throw new Error('GROUP_NOT_ASSIGNED');
        }
        return { success: true };
    }
    /**
     * Get all groups assigned to an exam
     */
    async getExamGroups(examId) {
        const result = await database_1.pool.query(`SELECT
        g.id,
        g.name,
        g.description,
        COUNT(DISTINCT sgm.student_id) as member_count,
        ega.created_at as access_granted_at,
        ega.created_by
      FROM exam_group_access ega
      JOIN student_groups g ON g.id = ega.group_id
      LEFT JOIN student_group_members sgm ON sgm.group_id = g.id
      WHERE ega.exam_id = $1
      GROUP BY g.id, g.name, g.description, ega.created_at, ega.created_by
      ORDER BY g.name`, [examId]);
        return result.rows;
    }
    /**
     * Check if student can access exam based on group membership
     */
    async canStudentAccessExam(studentId, examId) {
        // First check if exam uses group-based access
        const examResult = await database_1.pool.query('SELECT use_group_access FROM exams WHERE id = $1', [examId]);
        if (examResult.rows.length === 0) {
            throw new Error('EXAM_NOT_FOUND');
        }
        const useGroupAccess = examResult.rows[0].use_group_access;
        // If exam doesn't use group access, check general authorization
        if (!useGroupAccess) {
            const studentResult = await database_1.pool.query('SELECT is_authorized FROM students WHERE id = $1', [studentId]);
            return studentResult.rows.length > 0 && studentResult.rows[0].is_authorized;
        }
        // Check if student is in any group assigned to this exam
        const accessResult = await database_1.pool.query(`SELECT EXISTS (
        SELECT 1 FROM exam_group_access ega
        JOIN student_group_members sgm ON sgm.group_id = ega.group_id
        WHERE ega.exam_id = $1 AND sgm.student_id = $2
      ) as has_access`, [examId, studentId]);
        return accessResult.rows[0].has_access;
    }
}
exports.StudentGroupService = StudentGroupService;
exports.studentGroupService = new StudentGroupService();
//# sourceMappingURL=studentGroup.service.js.map