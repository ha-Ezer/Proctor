export interface CreateSessionData {
    studentId: string;
    examId: string;
    browserInfo: string;
    ipAddress?: string;
}
export interface SessionSnapshot {
    responses: Record<string, any>;
    violations: number;
    completionPercentage: number;
}
export declare class SessionService {
    /**
     * Create a new exam session for a student
     */
    createSession(data: CreateSessionData): Promise<any>;
    /**
     * Get session by ID
     */
    getSessionById(sessionId: string): Promise<any>;
    /**
     * Get session by session code
     */
    getSessionByCode(sessionCode: string): Promise<any>;
    /**
     * Save progress snapshot for recovery
     */
    saveSnapshot(sessionId: string, snapshotData: SessionSnapshot): Promise<any>;
    /**
     * Get latest snapshot for recovery
     */
    getLatestSnapshot(sessionId: string): Promise<any>;
    /**
     * Update session completion percentage
     */
    updateSessionStats(sessionId: string): Promise<void>;
    /**
     * Complete exam session
     */
    completeSession(sessionId: string, submissionType: 'manual' | 'auto_time_expired' | 'auto_violations'): Promise<any>;
    /**
     * Generate proctoring report
     */
    private generateProctoringReport;
    /**
     * Check if session should be terminated due to violations
     */
    checkViolationLimit(sessionId: string): Promise<boolean>;
    /**
     * Mark session for recovery (when resumed)
     */
    markSessionResumed(sessionId: string): Promise<void>;
    /**
     * Check if student has an existing in-progress session for an exam
     */
    checkExistingSession(studentId: string, examId: string): Promise<any>;
    /**
     * Get recovery data for a session (latest snapshot + session info)
     */
    getRecoveryData(sessionId: string): Promise<{
        session: {
            id: any;
            sessionCode: any;
            examId: any;
            examTitle: any;
            startTime: any;
            durationMinutes: any;
            maxViolations: any;
            violationsCount: any;
        };
        snapshot: any;
        canRecover: boolean;
    } | null>;
}
export declare const sessionService: SessionService;
//# sourceMappingURL=session.service.d.ts.map