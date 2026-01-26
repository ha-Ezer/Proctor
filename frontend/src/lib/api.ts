import axios, { AxiosError } from 'axios';
import { clearAllExamData } from './utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Convert snake_case keys to camelCase recursively
 */
function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  const camelObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelObj[camelKey] = toCamelCase(obj[key]);
    }
  }
  return camelObj;
}

/**
 * Axios instance with default configuration
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Add auth token to requests
 */
api.interceptors.request.use(
  (config) => {
    // Check for admin token first, then student token
    const adminToken = localStorage.getItem('proctor_admin_token');
    const studentToken = localStorage.getItem('proctor_token');
    const token = adminToken || studentToken;

    if (token) {
      // Remove quotes if token is JSON stringified
      const cleanToken = token.replace(/^"(.*)"$/, '$1');
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Handle response transformation and errors globally
 */
api.interceptors.response.use(
  (response) => {
    // Transform snake_case to camelCase
    if (response.data) {
      response.data = toCamelCase(response.data);
    }
    return response;
  },
  (error: AxiosError<{ message: string; code: string }>) => {
    // Handle token expiration or invalid token
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
      clearAllExamData();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

/**
 * API Types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Auth API
 */
export const authApi = {
  studentLogin: (email: string) =>
    api.post<ApiResponse<{ token: string; student: Student; needsProfileCompletion: boolean }>>('/auth/student/login', {
      email,
    }),

  completeProfile: (fullName: string) =>
    api.post<ApiResponse<Student>>('/auth/student/complete-profile', {
      fullName,
    }),

  verifyToken: () => api.get<ApiResponse<{ user: any }>>('/auth/verify'),
};

/**
 * Exam API
 */
export const examApi = {
  getActiveExam: () => api.get<ApiResponse<{ exam: Exam; questions: Question[] }>>('/exams/active'),
};

/**
 * Session API
 */
export const sessionApi = {
  startSession: (examId: string, browserInfo: string, ipAddress?: string) =>
    api.post<ApiResponse<Session>>('/sessions/start', {
      examId,
      browserInfo,
      ipAddress,
    }),

  checkExistingSession: (examId: string) =>
    api.get<ApiResponse<{ hasExistingSession: boolean; session: Session | null }>>(`/sessions/check/${examId}`),

  getSession: (sessionId: string) => api.get<ApiResponse<Session>>(`/sessions/${sessionId}`),

  getRecoveryData: (sessionId: string) =>
    api.get<ApiResponse<RecoveryData>>(`/sessions/${sessionId}/recovery`),

  saveSnapshot: (sessionId: string, snapshot: SessionSnapshot) =>
    api.post<ApiResponse<{ id: string; createdAt: string }>>(`/sessions/${sessionId}/snapshot`, snapshot),

  submitExam: (sessionId: string, submissionType: 'manual' | 'auto_time_expired' | 'auto_violations') =>
    api.post<ApiResponse<{ session: Session; report: any }>>(`/sessions/${sessionId}/submit`, {
      sessionId,
      submissionType,
    }),
};

/**
 * Response API
 */
export const responseApi = {
  saveResponse: (sessionId: string, questionId: string, response: ResponseData) =>
    api.post<ApiResponse<Response>>('/responses/save', {
      sessionId,
      questionId,
      ...response,
    }),

  bulkSaveResponses: (sessionId: string, responses: Array<{ questionId: string } & ResponseData>) =>
    api.post<ApiResponse<{ savedCount: number }>>('/responses/bulk', {
      sessionId,
      responses,
    }),

  getSessionResponses: (sessionId: string) =>
    api.get<ApiResponse<{ responses: Response[]; count: number }>>(`/responses/session/${sessionId}`),
};

/**
 * Violation API
 */
export const violationApi = {
  logViolation: (violation: ViolationData) =>
    api.post<ApiResponse<{ totalViolations: number; shouldTerminate: boolean }>>('/violations/log', violation),

  getSessionViolations: (sessionId: string) =>
    api.get<ApiResponse<{ violations: Violation[]; count: number }>>(`/violations/session/${sessionId}`),

  getViolationStats: (sessionId: string) =>
    api.get<ApiResponse<ViolationStats>>(`/violations/stats/${sessionId}`),
};

/**
 * Type Definitions
 */
export interface Student {
  id: string;
  email: string;
  fullName: string | null;
}

export interface Exam {
  id: string;
  title: string;
  version: string;
  durationMinutes: number;
  maxViolations: number;
  totalQuestions: number;
}

export interface Question {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: 'multiple-choice' | 'text' | 'textarea';
  required: boolean;
  placeholder?: string;
  imageUrl?: string;
  options?: Array<{ index: number; text: string }>;
}

export interface Session {
  id: string;
  sessionId: string;
  studentId: string;
  examId: string;
  startTime: string;
  endTime: string | null;
  scheduledEndTime: string;
  status: 'in_progress' | 'completed' | 'terminated' | 'expired';
  totalViolations: number;
  completionPercentage: number;
  score: number | null;
}

export interface SessionSnapshot {
  responses: Record<string, any>;
  violations: number;
  completionPercentage: number;
  currentQuestionIndex: number;
  timeRemaining: number;
}

export interface RecoveryData {
  session: Session;
  snapshot: SessionSnapshot;
  recoveryTimestamp: string;
  timeElapsed: number;
  minimumTimeRemaining: number;
}

export interface ResponseData {
  responseText?: string;
  responseOptionIndex?: number;
}

export interface Response {
  id: string;
  sessionId: string;
  questionId: string;
  responseText: string | null;
  responseOptionIndex: number | null;
  isCorrect: boolean | null;
  answeredAt: string;
}

export interface ViolationData {
  sessionId: string;
  violationType: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  browserInfo?: string;
  deviceInfo?: string;
  additionalData?: Record<string, any>;
}

export interface Violation {
  id: string;
  sessionId: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  browserInfo: string;
}

export interface ViolationStats {
  total: number;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byType: Record<string, number>;
}
