export interface LogViolationData {
    sessionId: string;
    violationType: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    description?: string;
    browserInfo?: string;
    deviceInfo?: string;
    additionalData?: Record<string, any>;
}
export declare class ViolationService {
    /**
     * Log a proctoring violation
     */
    logViolation(data: LogViolationData): Promise<{
        violationId: any;
        detectedAt: any;
        totalViolations: any;
        shouldTerminate: boolean;
    }>;
    /**
     * Get all violations for a session
     */
    getSessionViolations(sessionId: string): Promise<any[]>;
    /**
     * Get violation statistics for a session
     */
    getViolationStats(sessionId: string): Promise<any>;
    /**
     * Determine violation severity based on type
     */
    private determineSeverity;
    /**
     * Check if violation is serious enough to send alert
     */
    isSeriousViolation(violationType: string): boolean;
}
export declare const violationService: ViolationService;
//# sourceMappingURL=violation.service.d.ts.map