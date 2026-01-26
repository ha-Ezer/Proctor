import { create } from 'zustand';
import { Exam, Question, Session, Student } from '@/lib/api';
import { storage, STORAGE_KEYS } from '@/lib/storage';

interface ExamState {
  // Student data
  student: Student | null;
  setStudent: (student: Student | null) => void;

  // Exam data
  exam: Exam | null;
  questions: Question[];
  setExamData: (exam: Exam, questions: Question[]) => void;

  // Session data
  session: Session | null;
  setSession: (session: Session | null) => void;

  // Responses
  responses: Record<string, { responseText?: string; responseOptionIndex?: number }>;
  setResponse: (questionId: string, response: { responseText?: string; responseOptionIndex?: number }) => void;
  clearResponse: (questionId: string) => void;
  setAllResponses: (responses: Record<string, any>) => void;

  // Navigation
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  goToQuestion: (index: number) => void;

  // Violations
  violations: number;
  incrementViolations: () => void;
  setViolations: (count: number) => void;

  // UI state
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;

  // Recovery
  isRecovering: boolean;
  setIsRecovering: (isRecovering: boolean) => void;

  // Reset
  reset: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  // Student - initialize from localStorage
  student: storage.get(STORAGE_KEYS.STUDENT),
  setStudent: (student) => set({ student }),

  // Exam
  exam: null,
  questions: [],
  setExamData: (exam, questions) => set({ exam, questions }),

  // Session
  session: null,
  setSession: (session) => set({ session }),

  // Responses
  responses: {},
  setResponse: (questionId, response) =>
    set((state) => ({
      responses: {
        ...state.responses,
        [questionId]: response,
      },
    })),
  clearResponse: (questionId) =>
    set((state) => {
      const { [questionId]: _, ...rest } = state.responses;
      return { responses: rest };
    }),
  setAllResponses: (responses) => set({ responses }),

  // Navigation
  currentQuestionIndex: 0,
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  goToNextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },
  goToPreviousQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },
  goToQuestion: (index) => {
    const { questions } = get();
    if (index >= 0 && index < questions.length) {
      set({ currentQuestionIndex: index });
    }
  },

  // Violations
  violations: 0,
  incrementViolations: () => set((state) => ({ violations: state.violations + 1 })),
  setViolations: (count) => set({ violations: count }),

  // UI state
  isSubmitting: false,
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  // Recovery
  isRecovering: false,
  setIsRecovering: (isRecovering) => set({ isRecovering }),

  // Reset
  reset: () =>
    set({
      student: null,
      exam: null,
      questions: [],
      session: null,
      responses: {},
      currentQuestionIndex: 0,
      violations: 0,
      isSubmitting: false,
      isRecovering: false,
    }),
}));
