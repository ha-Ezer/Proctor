export interface StudentLoginData {
    email: string;
    fullName?: string;
}
export interface AdminLoginData {
    email: string;
    password: string;
}
export declare class AuthService {
    /**
     * Authenticate student and check authorization
     * NEW: Checks if profile completion is needed (no full_name)
     */
    authenticateStudent(data: StudentLoginData): Promise<{
        token: string;
        student: {
            id: any;
            email: any;
            fullName: any;
        };
        needsProfileCompletion: boolean;
    }>;
    /**
     * Complete student profile (add full name on first login)
     */
    completeStudentProfile(studentId: string, fullName: string): Promise<{
        id: any;
        email: any;
        fullName: any;
    }>;
    /**
     * Authenticate admin user
     */
    authenticateAdmin(data: AdminLoginData): Promise<{
        token: string;
        admin: {
            id: any;
            email: any;
            fullName: any;
            role: any;
        };
    }>;
    /**
     * Verify JWT token
     */
    verifyToken(token: string): any;
    /**
     * Create admin user (for initial setup)
     */
    createAdmin(email: string, password: string, fullName: string, role: 'super_admin' | 'admin' | 'viewer'): Promise<any>;
    /**
     * Authorize student (add to authorized list)
     */
    authorizeStudent(email: string, fullName: string): Promise<any>;
    /**
     * Revoke student authorization
     */
    revokeStudentAuthorization(email: string): Promise<any>;
    /**
     * Get all authorized students
     */
    getAuthorizedStudents(): Promise<any[]>;
    /**
     * Bulk import authorized students
     */
    bulkAuthorizeStudents(students: Array<{
        email: string;
        fullName: string;
    }>): Promise<any[]>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map