import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi, sessionApi, responseApi, SessionSnapshot } from '@/lib/api';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { useExamStore } from '@/stores/examStore';
import { useProctoring, VIOLATION_TYPES } from '@/hooks/useProctoring';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useTimer } from '@/hooks/useTimer';
import { getBrowserInfo, clearAllExamData } from '@/lib/utils';
import { Loader2, AlertTriangle, Calendar } from 'lucide-react';

// Import components
import { ExamHeader } from '@/components/exam/ExamHeader';
import { QuestionList } from '@/components/exam/QuestionList';
import { QuestionNavigation } from '@/components/exam/QuestionNavigation';
import { RecoveryDialog } from '@/components/exam/RecoveryDialog';
import { ViolationAlert } from '@/components/exam/ViolationAlert';
import { SubmitDialog } from '@/components/exam/SubmitDialog';

export function ExamPage() {
  const navigate = useNavigate();
  const {
    student,
    exam,
    questions,
    session,
    responses,
    currentQuestionIndex,
    violations,
    isSubmitting,
    setExamData,
    setSession,
    setResponse,
    setAllResponses,
    setCurrentQuestionIndex,
    setViolations,
    setIsSubmitting,
  } = useExamStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noActiveExam, setNoActiveExam] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [latestViolation, setLatestViolation] = useState<string>('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  /**
   * Initialize exam
   */
  useEffect(() => {
    const initializeExam = async () => {
      try {
        // Check if student is logged in
        const storedStudent = storage.get(STORAGE_KEYS.STUDENT);
        if (!storedStudent) {
          navigate('/login');
          return;
        }

        // Fetch active exam
        const examResponse = await examApi.getActiveExam();
        const { exam: examData, questions: questionsData } = examResponse.data.data;
        setExamData(examData, questionsData);

        // Check for existing session
        const existingSessionResponse = await sessionApi.checkExistingSession(examData.id);
        const { hasExistingSession, session: existingSession } = existingSessionResponse.data.data;

        if (hasExistingSession && existingSession) {
          // Check for recovery data
          try {
            const recoveryResponse = await sessionApi.getRecoveryData(existingSession.id);
            const recoveryDataFromApi = recoveryResponse.data.data;

            // Calculate time values
            const now = Date.now();
            const startTime = new Date(recoveryDataFromApi.session.startTime).getTime();
            const scheduledEndTime = new Date(existingSession.scheduledEndTime).getTime();
            const timeElapsed = Math.floor((now - startTime) / 1000); // seconds
            const minTimeGuarantee = 5 * 60; // 5 minutes minimum guarantee in seconds
            const timeRemaining = Math.max(Math.floor((scheduledEndTime - now) / 1000), 0);
            const minimumTimeRemaining = Math.max(timeRemaining, minTimeGuarantee);

            // Add calculated values to recovery data
            const enrichedRecoveryData = {
              ...recoveryDataFromApi,
              timeElapsed,
              minimumTimeRemaining,
              recoveryTimestamp: new Date().toISOString(),
            };

            setRecoveryData(enrichedRecoveryData);
            setShowRecovery(true);
            setSession(existingSession);
          } catch {
            // No recovery data, continue with existing session
            setSession(existingSession);
          }
        } else {
          // Start new session
          const newSessionResponse = await sessionApi.startSession(examData.id, JSON.stringify(getBrowserInfo()));
          const newSession = newSessionResponse.data.data;
          setSession(newSession);

          // Log exam started violation
          await logViolation(VIOLATION_TYPES.EXAM_STARTED, 'Exam session started');
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('Exam initialization error:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load exam';

        // Check if it's a "no active exam" error
        if (errorMessage.includes('NO_ACTIVE_EXAM') || errorMessage.includes('no active exam')) {
          setNoActiveExam(true);
        } else {
          setError(errorMessage);
        }

        setIsLoading(false);
      }
    };

    initializeExam();
  }, []);

  /**
   * Handle recovery acceptance
   */
  const handleAcceptRecovery = () => {
    if (!recoveryData) return;

    const { snapshot } = recoveryData;

    // Restore responses
    setAllResponses(snapshot.responses || {});

    // Restore violations
    setViolations(snapshot.violations || 0);

    // Restore current question
    setCurrentQuestionIndex(snapshot.currentQuestionIndex || 0);

    // Calculate remaining time
    const scheduledEnd = new Date(session!.scheduledEndTime).getTime();
    const now = Date.now();
    const remainingSeconds = Math.floor((scheduledEnd - now) / 1000);

    timer.setTime(remainingSeconds);

    setShowRecovery(false);

    // Log exam resumed
    logViolation(VIOLATION_TYPES.EXAM_RESUMED, 'Exam session resumed after interruption');
  };

  /**
   * Handle recovery decline (start fresh)
   */
  const handleDeclineRecovery = () => {
    setShowRecovery(false);

    // Start timer from beginning
    const durationSeconds = exam!.durationMinutes * 60;
    timer.setTime(durationSeconds);
  };

  /**
   * Handle logout - clear all data and return to login
   */
  const handleLogout = () => {
    clearAllExamData();
    useExamStore.getState().reset();
    navigate('/login', { replace: true });
  };

  /**
   * Timer setup
   */
  const timer = useTimer({
    initialSeconds: session ? Math.floor((new Date(session.scheduledEndTime).getTime() - Date.now()) / 1000) : 0,
    onExpire: () => handleTimeExpired(),
    enabled: !!session && !showRecovery,
  });

  /**
   * Update timer when session is loaded/changed
   */
  useEffect(() => {
    console.log('[ExamPage] Timer update effect:', {
      hasSession: !!session,
      scheduledEndTime: session?.scheduledEndTime,
      showRecovery
    });

    if (session && session.scheduledEndTime && !showRecovery) {
      const scheduledEnd = new Date(session.scheduledEndTime).getTime();
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((scheduledEnd - now) / 1000));

      console.log('[ExamPage] Setting timer to:', {
        scheduledEnd: new Date(scheduledEnd).toISOString(),
        now: new Date(now).toISOString(),
        remainingSeconds,
        formattedTime: `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, '0')}`
      });

      timer.setTime(remainingSeconds);

      // Also ensure timer is running
      if (!timer.isRunning) {
        console.log('[ExamPage] Timer not running, starting it');
        timer.start();
      }
    }
  }, [session?.id, session?.scheduledEndTime, showRecovery]);

  /**
   * Auto-save setup
   */
  const autoSave = useAutoSave({
    sessionId: session?.id || '',
    enabled: !!session && !isSubmitting,
    getSnapshotData: (): SessionSnapshot => ({
      responses,
      violations,
      completionPercentage: Math.round((Object.keys(responses).length / questions.length) * 100),
      currentQuestionIndex,
      timeRemaining: timer.timeRemaining,
    }),
  });

  /**
   * Proctoring setup
   */
  const { logViolation: logViolationDirect } = useProctoring({
    sessionId: session?.id || '',
    enabled: !!session && !isSubmitting,
    onViolation: (type, total) => {
      setViolations(total);
      setLatestViolation(type);
      setShowViolationAlert(true);

      // Hide alert after 5 seconds
      setTimeout(() => setShowViolationAlert(false), 5000);
    },
    onTerminate: () => handleMaxViolations(),
  });

  const logViolation = async (type: string, description: string) => {
    await logViolationDirect(type, description);
  };

  /**
   * Handle time expired
   */
  const handleTimeExpired = async () => {
    if (!session || isSubmitting) return;

    console.log('[ExamPage] ⏰ Time expired! Auto-submitting exam...');
    setIsSubmitting(true);

    try {
      // Save snapshot
      await autoSave.forceSave();

      // Bulk save all responses
      const responsesArray = Object.entries(responses).map(([questionId, answer]) => ({
        questionId,
        responseText: answer.responseText,
        responseOptionIndex: answer.responseOptionIndex,
      }));

      if (responsesArray.length > 0) {
        await responseApi.bulkSaveResponses(session.id, responsesArray);
        console.log(`[ExamPage] ✅ Bulk saved ${responsesArray.length} responses before time expiry`);
      }

      // Submit exam
      await sessionApi.submitExam(session.id, 'auto_time_expired');
      console.log('[ExamPage] ✅ Exam auto-submitted successfully');
      navigate('/complete?reason=time_expired');
    } catch (error) {
      console.error('Error submitting on time expiration:', error);
      setError('Failed to submit exam. Please contact your instructor.');
    }
  };

  /**
   * Handle max violations reached
   */
  const handleMaxViolations = async () => {
    if (!session || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Save snapshot
      await autoSave.forceSave();

      // Bulk save all responses
      const responsesArray = Object.entries(responses).map(([questionId, answer]) => ({
        questionId,
        responseText: answer.responseText,
        responseOptionIndex: answer.responseOptionIndex,
      }));

      if (responsesArray.length > 0) {
        await responseApi.bulkSaveResponses(session.id, responsesArray);
        console.log(`[ExamPage] ✅ Bulk saved ${responsesArray.length} responses before termination`);
      }

      // Submit exam
      await sessionApi.submitExam(session.id, 'auto_violations');
      navigate('/complete?reason=violations');
    } catch (error) {
      console.error('Error submitting on max violations:', error);
      setError('Session terminated due to violations.');
    }
  };

  /**
   * Handle manual submit
   */
  const handleSubmit = async () => {
    if (!session || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Save snapshot
      await autoSave.forceSave();

      // Bulk save all responses to ensure nothing is lost
      const responsesArray = Object.entries(responses).map(([questionId, answer]) => ({
        questionId,
        responseText: answer.responseText,
        responseOptionIndex: answer.responseOptionIndex,
      }));

      if (responsesArray.length > 0) {
        await responseApi.bulkSaveResponses(session.id, responsesArray);
        console.log(`[ExamPage] ✅ Bulk saved ${responsesArray.length} responses`);
      }

      // Submit exam
      await sessionApi.submitExam(session.id, 'manual');
      navigate('/complete');
    } catch (error) {
      console.error('Error submitting exam:', error);
      setError('Failed to submit exam. Please try again.');
      setIsSubmitting(false);
    }
  };

  /**
   * Handle answer change
   */
  const handleAnswerChange = async (questionId: string, answer: { responseText?: string; responseOptionIndex?: number }) => {
    // Update local state
    setResponse(questionId, answer);

    // Save response to database
    if (session?.id) {
      try {
        await responseApi.saveResponse(session.id, questionId, answer);
        console.log(`[ExamPage] ✅ Response saved for question ${questionId}`);
      } catch (error) {
        console.error(`[ExamPage] ❌ Failed to save response for question ${questionId}:`, error);
        // Still continue - response is saved locally and in snapshot
      }
    }

    // Trigger auto-save for snapshot
    autoSave.debouncedSave();
  };

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    );
  }

  /**
   * Render no active exam state
   */
  if (noActiveExam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full card text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No Tests Available</h2>
          <p className="text-muted-foreground mb-6">
            There are currently no tests scheduled for you. Please check back later or contact your instructor.
          </p>
          <button onClick={handleLogout} className="btn btn-primary w-full">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full card">
          <div className="flex items-center gap-3 text-destructive mb-4">
            <AlertTriangle className="w-8 h-8" />
            <h2 className="text-2xl font-bold text-foreground">Error</h2>
          </div>
          <p className="text-foreground mb-6">{error}</p>
          <button onClick={handleLogout} className="btn btn-primary w-full">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  /**
   * Check if exam data is loaded
   */
  if (!exam || !questions.length || !session) {
    return null;
  }

  const progress = Math.round((Object.keys(responses).length / questions.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Recovery Dialog */}
      {showRecovery && (
        <RecoveryDialog
          recoveryData={recoveryData}
          onAccept={handleAcceptRecovery}
          onDecline={handleDeclineRecovery}
        />
      )}

      {/* Violation Alert */}
      {showViolationAlert && (
        <ViolationAlert
          violationType={latestViolation}
          totalViolations={violations}
          maxViolations={exam?.maxViolations || 7}
          onClose={() => setShowViolationAlert(false)}
        />
      )}

      {/* Submit Dialog */}
      {showSubmitDialog && (
        <SubmitDialog
          answeredCount={Object.keys(responses).length}
          totalCount={questions.length}
          onConfirm={handleSubmit}
          onCancel={() => setShowSubmitDialog(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Header */}
      <ExamHeader
        examTitle={exam.title}
        studentName={student?.fullName || ''}
        timer={timer}
        progress={progress}
        violations={violations}
        maxViolations={exam?.maxViolations || 7}
      />

      {/* Fixed Submit Bar - Mobile only: always visible, no scroll recoil */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pt-4 bg-background/95 backdrop-blur-sm border-t border-border"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => setShowSubmitDialog(true)}
          className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-semibold"
        >
          <span>Submit Exam</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl pb-28 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Questions List - Scrollable */}
          <div className="lg:col-span-3 max-h-[calc(100vh-8rem)] lg:max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar pr-2 -mr-2">
            <QuestionList
              questions={questions}
              responses={responses}
              onResponseChange={handleAnswerChange}
            />

            {/* Submit Button - Sticky on desktop; fixed bar on mobile to avoid recoil/scroll quirks */}
            <div className="hidden lg:block sticky bottom-0 bg-background pt-6 pb-4 mt-8 border-t border-border -mb-2">
              <button
                onClick={() => setShowSubmitDialog(true)}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <span>Submit Exam</span>
              </button>
            </div>
          </div>

          {/* Question Navigation Sidebar - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <QuestionNavigation
                questions={questions}
                responses={responses}
                currentIndex={currentQuestionIndex}
                onQuestionSelect={(index) => {
                  const questionId = questions[index]?.id;
                  if (questionId) {
                    document.getElementById(`question-${questionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
