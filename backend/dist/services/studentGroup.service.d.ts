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
export declare class StudentGroupService {
    /**
     * Get all student groups with stats
     */
    getGroups(): Promise<StudentGroup[]>;
    /**
     * Get a single group by ID
     */
    getGroupById(groupId: string): Promise<any>;
    /**
     * Create a new student group
     */
    createGroup(data: CreateGroupData): Promise<any>;
    /**
     * Update group details
     */
    updateGroup(groupId: string, data: {
        name?: string;
        description?: string;
    }): Promise<any>;
    /**
     * Delete a student group
     */
    deleteGroup(groupId: string): Promise<{
        success: boolean;
        groupName: any;
    }>;
    /**
     * Add student to group
     */
    addStudentToGroup(groupId: string, studentId: string, addedBy?: string): Promise<any>;
    /**
     * Add multiple students to group by email
     */
    addStudentsByEmail(groupId: string, emails: string[], addedBy?: string): Promise<{
        added: number;
        notFound: string[];
        alreadyInGroup: string[];
        details: any[];
    }>;
    /**
     * Remove student from group
     */
    removeStudentFromGroup(groupId: string, studentId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get all members of a group
     */
    getGroupMembers(groupId: string): Promise<any[]>;
    /**
     * Get all groups a student belongs to
     */
    getStudentGroups(studentId: string): Promise<any[]>;
    /**
     * Assign group to exam
     */
    assignGroupToExam(examId: string, groupId: string, createdBy?: string): Promise<any>;
    /**
     * Remove group from exam
     */
    removeGroupFromExam(examId: string, groupId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get all groups assigned to an exam
     */
    getExamGroups(examId: string): Promise<any[]>;
    /**
     * Check if student can access exam based on group membership
     */
    canStudentAccessExam(studentId: string, examId: string): Promise<boolean>;
}
export declare const studentGroupService: StudentGroupService;
//# sourceMappingURL=studentGroup.service.d.ts.map