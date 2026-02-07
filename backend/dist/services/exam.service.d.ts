export declare class ExamService {
    /**
     * Get active exam with all questions.
     * When studentId is provided, enforces group-based access: if the exam uses group access,
     * the student must be in an assigned group to see it.
     */
    getActiveExam(studentId: string): Promise<{
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