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
export declare class AdminService {
    /**
     * Get all sessions with filtering, sorting, and pagination
     */
    getSessions(filters: SessionFilters): Promise<{
        sessions: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Get detailed session information including questions and responses
     */
    getSessionDetails(sessionId: string): Promise<{
        session: any;
        responses: ({
            questionId: any;
            questionNumber: any;
            questionText: any;
            questionType: any;
            imageUrl: any;
            options: any[];
            selectedOptionIndex: any;
            selectedOption: any;
            correctAnswer: any;
            isCorrect: any;
            answeredAt: any;
            note: any;
            responseText?: undefined;
        } | {
            questionId: any;
            questionNumber: any;
            questionText: any;
            questionType: any;
            imageUrl: any;
            responseText: any;
            answeredAt: any;
            note: any;
            options?: undefined;
            selectedOptionIndex?: undefined;
            selectedOption?: undefined;
            correctAnswer?: undefined;
            isCorrect?: undefined;
        })[];
        violations: any[];
    }>;
    /**
     * Get dashboard statistics
     */
    getDashboardStats(): Promise<{
        totalSessions: number;
        activeSessions: number;
        completedSessions: number;
        completedToday: number;
        totalStudents: number;
        totalExams: number;
        averageCompletionRate: string;
        averageViolations: string;
        averageScore: string;
        flaggedSessions: number;
        recentSessions: any[];
        violationTrends: any[];
    }>;
    /**
     * Export sessions as CSV data
     */
    exportSessions(filters: SessionFilters): Promise<{
        sessionId: any;
        studentName: any;
        studentEmail: any;
        examTitle: any;
        startTime: any;
        endTime: any;
        status: any;
        completionPercentage: any;
        totalViolations: any;
        score: any;
        submissionType: any;
    }[]>;
    /**
     * Manage authorized students - Add new student
     */
    addAuthorizedStudent(email: string, fullName?: string): Promise<any>;
    /**
     * Remove student authorization
     */
    removeAuthorizedStudent(email: string): Promise<any>;
    /**
     * Bulk add students from CSV data
     */
    bulkAddStudents(students: Array<{
        email: string;
        fullName: string;
    }>): Promise<any[]>;
    /**
     * Get all students (authorized and unauthorized)
     * Includes authorization status and session count
     */
    getAuthorizedStudents(): Promise<{
        id: any;
        email: any;
        fullName: any;
        isAuthorized: any;
        lastLogin: any;
        createdAt: any;
        totalSessions: number;
    }[]>;
    /**
     * Create new exam
     */
    createExam(data: {
        title: string;
        description?: string;
        version: string;
        durationMinutes: number;
        maxViolations?: number;
    }): Promise<any>;
    /**
     * Add question to exam
     */
    addQuestion(data: {
        examId: string;
        questionNumber: number;
        questionText: string;
        questionType: 'multiple-choice' | 'text' | 'textarea';
        required?: boolean;
        placeholder?: string;
        imageUrl?: string;
        options?: string[];
        correctAnswer?: number;
    }): Promise<{
        questionId: any;
        success: boolean;
    }>;
    /**
     * Activate/deactivate exam
     */
    setExamActive(examId: string, isActive: boolean): Promise<any>;
    /**
     * Update exam
     */
    updateExam(examId: string, data: Partial<{
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
    }>): Promise<any>;
    /**
     * Get all exams
     */
    getExams(): Promise<any[]>;
    /**
     * Get exam by ID
     */
    getExamById(examId: string): Promise<any>;
    /**
     * Get questions for an exam
     */
    getExamQuestions(examId: string): Promise<any[]>;
    /**
     * Delete all questions for an exam (used before re-saving edited questions)
     */
    deleteExamQuestions(examId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Delete an exam (CASCADE deletes questions, sessions, responses, violations, etc.)
     */
    deleteExam(examId: string): Promise<{
        success: boolean;
        examTitle: any;
        completedSessionsCount: number;
    }>;
    /**
     * Get exam report - all students and their responses for a specific exam
     */
    getExamReport(examId: string): Promise<{
        exam: any;
        questions: any[];
        students: {
            studentId: any;
            studentName: any;
            studentEmail: any;
            sessionId: any;
            submissionTime: any;
            status: any;
            totalViolations: any;
            score: any;
            responses: ({
                questionId: any;
                responseOptionIndex: any;
                isCorrect: any;
                answeredAt: any;
                responseText?: undefined;
            } | {
                questionId: any;
                responseText: any;
                answeredAt: any;
                responseOptionIndex?: undefined;
                isCorrect?: undefined;
            } | null)[];
        }[];
        colors: {
            session_id: string;
            question_id: string;
            color: string;
        }[];
    }>;
    /**
     * Save cell color for exam report
     */
    saveExamReportCellColor(examId: string, sessionId: string, questionId: string, color: string): Promise<{
        success: boolean;
    }>;
    /**
     * Save or update a note for a question response in a session
     */
    saveSessionQuestionNote(sessionId: string, questionId: string, note: string, adminId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Delete a note for a question response
     */
    deleteSessionQuestionNote(sessionId: string, questionId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get cell colors for an exam report
     */
    getExamReportCellColors(examId: string): Promise<any[]>;
    /**
     * Delete cell color
     */
    deleteExamReportCellColor(examId: string, sessionId: string, questionId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get auto-saved snapshots for an exam (for data recovery purposes)
     */
    getExamSnapshots(examId: string): Promise<{
        snapshots: any[];
        count: number;
    }>;
    /**
     * Get latest snapshot for each session of an exam
     */
    getExamLatestSnapshots(examId: string): Promise<{
        snapshots: any[];
        count: number;
    }>;
    /**
     * Clear all snapshots for an exam
     */
    clearExamSnapshots(examId: string): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
    /**
     * Clear snapshots for a specific session
     */
    clearSessionSnapshots(sessionId: string): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
}
export declare const adminService: AdminService;
//# sourceMappingURL=admin.service.d.ts.map