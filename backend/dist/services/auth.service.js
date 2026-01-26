"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const environment_1 = require("../config/environment");
class AuthService {
    /**
     * Authenticate student and check authorization
     * NEW: Checks if profile completion is needed (no full_name)
     */
    async authenticateStudent(data) {
        // Check if student exists
        let result = await database_1.pool.query('SELECT * FROM students WHERE LOWER(email) = LOWER($1)', [data.email]);
        let student = result.rows[0];
        // If student doesn't exist, reject (admin must add them first)
        if (!student) {
            throw new Error('UNAUTHORIZED_EMAIL');
        }
        // Check authorization
        if (!student.is_authorized) {
            throw new Error('UNAUTHORIZED_EMAIL');
        }
        // Check if profile completion is needed (no full_name)
        const needsProfileCompletion = !student.full_name;
        // Update last login
        await database_1.pool.query('UPDATE students SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [student.id]);
        // Generate JWT token (expires after exam duration + buffer)
        const token = jsonwebtoken_1.default.sign({
            id: student.id,
            email: student.email,
            type: 'student',
        }, environment_1.config.jwt.secret, { expiresIn: environment_1.config.jwt.expiration });
        return {
            token,
            student: {
                id: student.id,
                email: student.email,
                fullName: student.full_name,
            },
            needsProfileCompletion,
        };
    }
    /**
     * Complete student profile (add full name on first login)
     */
    async completeStudentProfile(studentId, fullName) {
        const result = await database_1.pool.query(`UPDATE students
       SET full_name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND full_name IS NULL
       RETURNING *`, [fullName, studentId]);
        if (result.rows.length === 0) {
            throw new Error('PROFILE_ALREADY_COMPLETED');
        }
        return {
            id: result.rows[0].id,
            email: result.rows[0].email,
            fullName: result.rows[0].full_name,
        };
    }
    /**
     * Authenticate admin user
     */
    async authenticateAdmin(data) {
        // Get admin user
        const result = await database_1.pool.query('SELECT * FROM admin_users WHERE LOWER(email) = LOWER($1) AND is_active = true', [data.email]);
        const admin = result.rows[0];
        if (!admin) {
            throw new Error('INVALID_CREDENTIALS');
        }
        // Verify password
        const isPasswordValid = await bcrypt_1.default.compare(data.password, admin.password_hash);
        if (!isPasswordValid) {
            throw new Error('INVALID_CREDENTIALS');
        }
        // Update last login
        await database_1.pool.query('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [admin.id]);
        // Generate JWT token (24-hour expiration for admins)
        const token = jsonwebtoken_1.default.sign({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            type: 'admin',
        }, environment_1.config.jwt.secret, { expiresIn: environment_1.config.jwt.adminExpiration });
        return {
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                fullName: admin.full_name,
                role: admin.role,
            },
        };
    }
    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
        }
        catch (error) {
            throw new Error('INVALID_TOKEN');
        }
    }
    /**
     * Create admin user (for initial setup)
     */
    async createAdmin(email, password, fullName, role) {
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(password, 12);
        const result = await database_1.pool.query(`INSERT INTO admin_users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role`, [email, passwordHash, fullName, role]);
        return result.rows[0];
    }
    /**
     * Authorize student (add to authorized list)
     */
    async authorizeStudent(email, fullName) {
        const result = await database_1.pool.query(`INSERT INTO students (email, full_name, is_authorized)
       VALUES ($1, $2, true)
       ON CONFLICT (email) DO UPDATE SET
         is_authorized = true,
         full_name = EXCLUDED.full_name,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`, [email, fullName]);
        return result.rows[0];
    }
    /**
     * Revoke student authorization
     */
    async revokeStudentAuthorization(email) {
        const result = await database_1.pool.query(`UPDATE students
       SET is_authorized = false,
           updated_at = CURRENT_TIMESTAMP
       WHERE LOWER(email) = LOWER($1)
       RETURNING *`, [email]);
        return result.rows[0];
    }
    /**
     * Get all authorized students
     */
    async getAuthorizedStudents() {
        const result = await database_1.pool.query('SELECT id, email, full_name, last_login, created_at FROM students WHERE is_authorized = true ORDER BY full_name');
        return result.rows;
    }
    /**
     * Bulk import authorized students
     */
    async bulkAuthorizeStudents(students) {
        const client = await database_1.pool.connect();
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
            console.log(`✅ Authorized ${results.length} students`);
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
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map