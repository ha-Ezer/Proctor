export declare class ExamService {
    /**
     * Get active exam with all questions
     */
    getActiveExam(): Promise<{
        exam: any;
        questions: any[];
    }>;
    /**
     * Get exam by ID
     */
    getExamById(examId: string): Promise<any>;
}
export declare const examService: ExamService;
//# sourceMappingURL=exam.service.d.ts.map