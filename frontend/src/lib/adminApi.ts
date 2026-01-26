import { api, ApiResponse } from './api';

// ============================================
// Admin Types
// ============================================

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'viewer';
}

export interface DashboardStats {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalStudents: number;
  totalExams: number;
  flaggedSessions: number;
  averageScore: string; // Already formatted as string from backend
  averageViolations: string; // Already formatted as string from backend
}

export interface ExamDetails {
  id: string;
  title: string;
  description?: string;
  version: string;
  durationMinutes: number;
  maxViolations: number;
  isActive: boolean;
  enableFullscreen: boolean;
  autoSaveIntervalSeconds: number;
  warningAtMinutes: number;
  minTimeGuaranteeMinutes: number;
  questionCount?: number; // Changed from totalQuestions to match backend
  useGroupAccess?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentInfo {
  id: string;
  email: string;
  fullName: string | null; // Nullable until student completes profile
  isAuthorized: boolean;
  createdAt: string;
  lastLogin?: string;
  totalSessions?: number;
}

export interface SessionDetails {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  startTime: string;
  endTime?: string;
  scheduledEndTime: string;
  actualDurationSeconds?: number;
  status: 'in_progress' | 'completed' | 'terminated';
  completionPercentage: number;
  totalViolations: number;
  score?: number;
  submissionType?: string;
  wasResumed: boolean;
  resumeCount: number;
  browserInfo?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface ViolationLog {
  id: string;
  sessionId: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  detectedAt: string;
  metadata?: any;
}

export interface ProctoringReport {
  id: string;
  sessionId: string;
  totalViolations: number;
  violationTypes: string[];
  status: 'clean' | 'minor_issues' | 'flagged_for_review' | 'suspected_cheating';
  autoFlagged: boolean;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface CreateExamData {
  title: string;
  description?: string;
  version?: string;
  durationMinutes: number;
  maxViolations: number;
  enableFullscreen?: boolean;
  autoSaveIntervalSeconds?: number;
  warningAtMinutes?: number;
  minTimeGuaranteeMinutes?: number;
  useGroupAccess?: boolean;
  groupIds?: string[];
}

export interface AddQuestionData {
  examId: string;
  questionNumber: number;
  questionText: string;
  questionType: 'multiple-choice' | 'text' | 'textarea';
  required?: boolean;
  placeholder?: string;
  imageUrl?: string;
  options?: Array<{ index: number; text: string; isCorrect: boolean }>;
}

export interface AddStudentData {
  email: string;
  fullName?: string; // Optional - student provides on first login
}

export interface SessionFilters {
  examId?: string;
  studentId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  flaggedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface StudentGroup {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  examCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
}

export interface GroupMember {
  id: string;
  email: string;
  fullName: string;
  addedAt: string;
  addedBy?: string;
}

export interface ExamGroup {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  accessGrantedAt: string;
  createdBy?: string;
}

// Session Detail Types
export interface QuestionResponse {
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionType: 'multiple-choice' | 'text' | 'textarea';
  imageUrl?: string;
  // For multiple-choice
  options?: string[];
  selectedOptionIndex?: number;
  selectedOption?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  // For text/textarea
  responseText?: string;
  answeredAt?: string;
  // Admin note
  note?: string | null;
}

export interface SessionDetailData {
  session: SessionDetails;
  responses: QuestionResponse[];
  violations: ViolationLog[];
}

// Exam Report Types
export interface ExamReportQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: 'multiple-choice' | 'text' | 'textarea';
  imageUrl?: string;
}

export interface ExamReportResponse {
  questionId: string;
  responseOptionIndex?: number;
  isCorrect?: boolean;
  responseText?: string;
  answeredAt?: string;
}

export interface ExamReportStudent {
  studentId: string;
  studentName: string;
  studentEmail: string;
  sessionId: string;
  submissionTime: string;
  status: string;
  totalViolations: number;
  score?: number;
  responses: (ExamReportResponse | null)[];
}

export interface ExamReportCellColor {
  sessionId: string;
  questionId: string;
  color: string;
}

export interface ExamReportData {
  exam: ExamDetails;
  questions: ExamReportQuestion[];
  students: ExamReportStudent[];
  colors: ExamReportCellColor[];
}

// Auto-Save Snapshot Types
export interface ExamSnapshot {
  id: string;
  session_id: string;
  snapshot_data: {
    responses: Record<string, any>;
    violations: any[];
    currentQuestionIndex: number;
    lastSaved: string;
  };
  responses_count: number;
  violations_count: number;
  completion_percentage: number;
  created_at: string;
  student_id: string;
  student_email: string;
  student_name: string | null;
  exam_title: string;
  session_status?: string;
}

// ============================================
// Admin API Client
// ============================================

export const adminApi = {
  // ==================== Auth ====================
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; admin: AdminUser }>>('/auth/admin/login', {
      email,
      password,
    }),

  // ==================== Dashboard ====================
  getDashboardStats: () => api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats'),

  // ==================== Exams ====================
  getExams: () => api.get<ApiResponse<{ exams: ExamDetails[]; count: number }>>('/admin/exams'),

  getExamById: (examId: string) => api.get<ApiResponse<ExamDetails>>(`/admin/exams/${examId}`),

  createExam: (data: CreateExamData) => api.post<ApiResponse<ExamDetails>>('/admin/exams/create', data),

  updateExam: (examId: string, data: Partial<CreateExamData>) =>
    api.patch<ApiResponse<ExamDetails>>(`/admin/exams/${examId}`, data),

  activateExam: (examId: string, isActive: boolean) =>
    api.post<ApiResponse<{ success: boolean }>>(`/admin/exams/${examId}/activate`, { isActive }),

  deleteExam: (examId: string) =>
    api.delete<ApiResponse<{ success: boolean; examTitle: string; completedSessionsCount: number }>>(`/admin/exams/${examId}`),

  // ==================== Questions ====================
  getExamQuestions: (examId: string) =>
    api.get<ApiResponse<{ questions: any[]; count: number }>>(`/admin/exams/${examId}/questions`),

  deleteExamQuestions: (examId: string) =>
    api.delete<ApiResponse<{ success: boolean }>>(`/admin/exams/${examId}/questions`),

  addQuestion: (data: AddQuestionData) =>
    api.post<ApiResponse<{ id: string }>>('/admin/questions/add', data),

  // ==================== Students ====================
  getStudents: () => api.get<ApiResponse<{ students: StudentInfo[]; count: number }>>('/admin/students'),

  addStudent: (data: AddStudentData) => api.post<ApiResponse<StudentInfo>>('/admin/students/add', data),

  removeStudent: (email: string) =>
    api.post<ApiResponse<{ success: boolean }>>('/admin/students/remove', { email }),

  bulkAddStudents: (students: AddStudentData[]) =>
    api.post<ApiResponse<{ added: number; failed: number }>>('/admin/students/bulk', { students }),

  // ==================== Sessions ====================
  getSessions: (filters?: SessionFilters) =>
    api.get<ApiResponse<{ sessions: SessionDetails[]; pagination: any }>>('/admin/sessions', { params: filters }),

  getSessionDetails: (sessionId: string) =>
    api.get<ApiResponse<SessionDetailData>>(
      `/admin/sessions/${sessionId}/details`
    ),

  saveSessionQuestionNote: (sessionId: string, questionId: string, note: string) =>
    api.post<ApiResponse<{ success: boolean }>>(`/admin/sessions/${sessionId}/notes`, {
      questionId,
      note,
    }),

  deleteSessionQuestionNote: (sessionId: string, questionId: string) =>
    api.delete<ApiResponse<{ success: boolean }>>(`/admin/sessions/${sessionId}/notes`, {
      data: { questionId },
    }),

  exportSessions: (filters?: SessionFilters) =>
    api.get<Blob>('/admin/sessions/export', {
      params: filters,
      responseType: 'blob',
    }),

  // ==================== Student Groups ====================
  getGroups: () =>
    api.get<ApiResponse<{ groups: StudentGroup[]; count: number }>>('/admin/groups'),

  getGroupById: (groupId: string) =>
    api.get<ApiResponse<StudentGroup>>(`/admin/groups/${groupId}`),

  createGroup: (data: CreateGroupData) =>
    api.post<ApiResponse<StudentGroup>>('/admin/groups', data),

  updateGroup: (groupId: string, data: { name?: string; description?: string }) =>
    api.patch<ApiResponse<StudentGroup>>(`/admin/groups/${groupId}`, data),

  deleteGroup: (groupId: string) =>
    api.delete<ApiResponse<{ success: boolean; groupName: string }>>(`/admin/groups/${groupId}`),

  getGroupMembers: (groupId: string) =>
    api.get<ApiResponse<{ members: GroupMember[]; count: number }>>(`/admin/groups/${groupId}/members`),

  addStudentToGroup: (groupId: string, studentId: string) =>
    api.post<ApiResponse<any>>(`/admin/groups/${groupId}/members`, { studentId }),

  addStudentsByEmailToGroup: (groupId: string, emails: string[]) =>
    api.post<ApiResponse<{ added: number; notFound: string[]; alreadyInGroup: string[] }>>(
      `/admin/groups/${groupId}/members/bulk`,
      { emails }
    ),

  removeStudentFromGroup: (groupId: string, studentId: string) =>
    api.delete<ApiResponse<{ success: boolean }>>(`/admin/groups/${groupId}/members/${studentId}`),

  getExamGroups: (examId: string) =>
    api.get<ApiResponse<{ groups: ExamGroup[]; count: number }>>(`/admin/exams/${examId}/groups`),

  assignGroupToExam: (examId: string, groupId: string) =>
    api.post<ApiResponse<any>>(`/admin/exams/${examId}/groups`, { groupId }),

  removeGroupFromExam: (examId: string, groupId: string) =>
    api.delete<ApiResponse<{ success: boolean }>>(`/admin/exams/${examId}/groups/${groupId}`),

  // ==================== Exam Reports ====================
  getExamReport: (examId: string) =>
    api.get<ApiResponse<ExamReportData>>(`/admin/exams/${examId}/report`),

  getExamReportCellColors: (examId: string) =>
    api.get<ApiResponse<{ colors: ExamReportCellColor[] }>>(`/admin/exams/${examId}/report/colors`),

  saveExamReportCellColor: (examId: string, sessionId: string, questionId: string, color: string) =>
    api.post<ApiResponse<{ success: boolean }>>(`/admin/exams/${examId}/report/colors`, {
      sessionId,
      questionId,
      color,
    }),

  deleteExamReportCellColor: (examId: string, sessionId: string, questionId: string) =>
    api.delete<ApiResponse<{ success: boolean }>>(`/admin/exams/${examId}/report/colors`, {
      data: { sessionId, questionId },
    }),

  // ==================== Auto-Save Snapshots (Data Recovery) ====================
  getExamSnapshots: (examId: string, latest?: boolean) =>
    api.get<ApiResponse<{ snapshots: ExamSnapshot[]; count: number }>>(`/admin/exams/${examId}/snapshots`, {
      params: { latest: latest ? 'true' : 'false' },
    }),

  clearExamSnapshots: (examId: string) =>
    api.delete<ApiResponse<{ success: boolean; deletedCount: number }>>(`/admin/exams/${examId}/snapshots`),

  clearSessionSnapshots: (sessionId: string) =>
    api.delete<ApiResponse<{ success: boolean; deletedCount: number }>>(`/admin/sessions/${sessionId}/snapshots`),
};
