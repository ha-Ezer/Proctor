import { pool } from '../config/database';

export interface StudentGroup {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  examCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  createdBy?: string;
}

export class StudentGroupService {
  /**
   * Get all student groups with stats
   * Uses v_group_stats view if present; otherwise queries tables directly (e.g. if migration failed partway)
   */
  async getGroups(): Promise<StudentGroup[]> {
    try {
      const result = await pool.query(`
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
      // Map database field names to frontend expected names
      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        memberCount: Number(row.member_count) || 0,
        examCount: Number(row.exam_count) || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
      }));
    } catch (err: any) {
      if (err?.code === '42P01') {
        // View or table missing - fallback: query student_groups with inline counts
        try {
          const result = await pool.query(`
            SELECT
              g.id,
              g.name,
              g.description,
              (SELECT COUNT(*) FROM student_group_members WHERE group_id = g.id)::int as member_count,
              (SELECT COUNT(*) FROM exam_group_access WHERE group_id = g.id)::int as exam_count,
              g.created_at,
              g.updated_at
            FROM student_groups g
            ORDER BY g.name
          `);
          // Map database field names to frontend expected names
          return result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            memberCount: Number(row.member_count) || 0,
            examCount: Number(row.exam_count) || 0,
            createdAt: row.created_at,
            updatedAt: row.updated_at || row.created_at,
          }));
        } catch (fallbackErr: any) {
          if (fallbackErr?.code === '42P01') {
            return []; // student_groups table missing (migration not run)
          }
          throw fallbackErr;
        }
      }
      throw err;
    }
  }

  /**
   * Get a single group by ID
   */
  async getGroupById(groupId: string) {
    const result = await pool.query(
      `SELECT
        g.*,
        (SELECT COUNT(*) FROM student_group_members WHERE group_id = g.id) as member_count,
        (SELECT COUNT(*) FROM exam_group_access WHERE group_id = g.id) as exam_count
      FROM student_groups g
      WHERE g.id = $1`,
      [groupId]
    );

    if (result.rows.length === 0) {
      throw new Error('GROUP_NOT_FOUND');
    }

    const row = result.rows[0];
    // Map database field names to frontend expected names
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      memberCount: Number(row.member_count) || 0,
      examCount: Number(row.exam_count) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Create a new student group
   */
  async createGroup(data: CreateGroupData) {
    try {
      // Check if name already exists
      const existingResult = await pool.query('SELECT id FROM student_groups WHERE LOWER(name) = LOWER($1)', [
        data.name,
      ]);

      if (existingResult.rows.length > 0) {
        throw new Error('GROUP_NAME_EXISTS');
      }

      const result = await pool.query(
        `INSERT INTO student_groups (name, description, created_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [data.name, data.description || null, data.createdBy || null]
      );

      return result.rows[0];
    } catch (err: any) {
      if (err?.code === '42P01') {
        const e = new Error('GROUPS_TABLE_MISSING') as Error & { code?: string };
        e.code = 'GROUPS_TABLE_MISSING';
        throw e;
      }
      throw err;
    }
  }

  /**
   * Update group details
   */
  async updateGroup(groupId: string, data: { name?: string; description?: string }) {
    const updates: string[] = [];
    const params: any[] = [];
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

    const result = await pool.query(
      `UPDATE student_groups
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new Error('GROUP_NOT_FOUND');
    }

    return result.rows[0];
  }

  /**
   * Delete a student group
   */
  async deleteGroup(groupId: string) {
    const result = await pool.query('DELETE FROM student_groups WHERE id = $1 RETURNING name', [groupId]);

    if (result.rows.length === 0) {
      throw new Error('GROUP_NOT_FOUND');
    }

    return { success: true, groupName: result.rows[0].name };
  }

  /**
   * Add student to group
   */
  async addStudentToGroup(groupId: string, studentId: string, addedBy?: string) {
    try {
      const result = await pool.query(
        `INSERT INTO student_group_members (group_id, student_id, added_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [groupId, studentId, addedBy || null]
      );

      return result.rows[0];
    } catch (error: any) {
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
  async addStudentsByEmail(groupId: string, emails: string[], addedBy?: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const added: any[] = [];
      const notFound: string[] = [];
      const alreadyInGroup: string[] = [];

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
          const result = await client.query(
            `INSERT INTO student_group_members (group_id, student_id, added_by)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [groupId, studentId, addedBy || null]
          );

          added.push({ email, ...result.rows[0] });
        } catch (error: any) {
          if (error.code === '23505') {
            alreadyInGroup.push(email);
          } else {
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
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove student from group
   */
  async removeStudentFromGroup(groupId: string, studentId: string) {
    const result = await pool.query(
      'DELETE FROM student_group_members WHERE group_id = $1 AND student_id = $2 RETURNING *',
      [groupId, studentId]
    );

    if (result.rows.length === 0) {
      throw new Error('STUDENT_NOT_IN_GROUP');
    }

    return { success: true };
  }

  /**
   * Get all members of a group
   */
  async getGroupMembers(groupId: string) {
    const result = await pool.query(
      `SELECT
        s.id,
        s.email,
        s.full_name,
        sgm.added_at,
        sgm.added_by
      FROM student_group_members sgm
      JOIN students s ON s.id = sgm.student_id
      WHERE sgm.group_id = $1
      ORDER BY s.full_name`,
      [groupId]
    );

    return result.rows;
  }

  /**
   * Get all groups a student belongs to
   */
  async getStudentGroups(studentId: string) {
    const result = await pool.query(
      `SELECT
        g.id,
        g.name,
        g.description,
        sgm.added_at
      FROM student_group_members sgm
      JOIN student_groups g ON g.id = sgm.group_id
      WHERE sgm.student_id = $1
      ORDER BY g.name`,
      [studentId]
    );

    return result.rows;
  }

  /**
   * Assign group to exam
   */
  async assignGroupToExam(examId: string, groupId: string, createdBy?: string) {
    try {
      const result = await pool.query(
        `INSERT INTO exam_group_access (exam_id, group_id, created_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [examId, groupId, createdBy || null]
      );

      return result.rows[0];
    } catch (error: any) {
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
  async removeGroupFromExam(examId: string, groupId: string) {
    const result = await pool.query(
      'DELETE FROM exam_group_access WHERE exam_id = $1 AND group_id = $2 RETURNING *',
      [examId, groupId]
    );

    if (result.rows.length === 0) {
      throw new Error('GROUP_NOT_ASSIGNED');
    }

    return { success: true };
  }

  /**
   * Get all groups assigned to an exam
   */
  async getExamGroups(examId: string) {
    const result = await pool.query(
      `SELECT
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
      ORDER BY g.name`,
      [examId]
    );

    return result.rows;
  }

  /**
   * Check if student can access exam based on group membership
   */
  async canStudentAccessExam(studentId: string, examId: string): Promise<boolean> {
    // First check if exam uses group-based access
    const examResult = await pool.query('SELECT use_group_access FROM exams WHERE id = $1', [examId]);

    if (examResult.rows.length === 0) {
      throw new Error('EXAM_NOT_FOUND');
    }

    const useGroupAccess = examResult.rows[0].use_group_access;

    // If exam doesn't use group access, check general authorization
    if (!useGroupAccess) {
      const studentResult = await pool.query('SELECT is_authorized FROM students WHERE id = $1', [studentId]);
      return studentResult.rows.length > 0 && studentResult.rows[0].is_authorized;
    }

    // Check if student is in any group assigned to this exam
    const accessResult = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM exam_group_access ega
        JOIN student_group_members sgm ON sgm.group_id = ega.group_id
        WHERE ega.exam_id = $1 AND sgm.student_id = $2
      ) as has_access`,
      [examId, studentId]
    );

    return accessResult.rows[0].has_access;
  }
}

export const studentGroupService = new StudentGroupService();
