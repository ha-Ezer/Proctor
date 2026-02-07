import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Clock, LogOut } from 'lucide-react';
import { clearAllExamData } from '@/lib/utils';
import { useExamStore } from '@/stores/examStore';
import { ThemeToggle } from '@/components/theme-toggle';

export function CompletePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason'); // 'violations', 'time_expired', or null
  const reset = useExamStore((state) => state.reset);

  useEffect(() => {
    // Clear auto-save interval and proctoring if any
    return () => {
      reset();
    };
  }, [reset]);

  const handleLogout = () => {
    // Clear all stored data from localStorage
    clearAllExamData();

    // Reset Zustand store
    reset();

    // Navigate to login page (replace to prevent back button)
    navigate('/login', { replace: true });
  };

  const isViolationTermination = reason === 'violations';
  const isTimeExpired = reason === 'time_expired';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center p-4">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-2xl w-full">
        {/* Success Card */}
        {!isViolationTermination ? (
          <div className="card text-center animate-fade-in">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {isTimeExpired ? 'Time Expired - Exam Submitted' : 'Exam Submitted Successfully!'}
            </h1>

            {/* Message */}
            <p className="text-lg text-muted-foreground mb-8">
              {isTimeExpired
                ? 'Your exam time has expired. Your progress has been automatically saved and submitted.'
                : 'Thank you for completing the exam. Your responses have been recorded and submitted.'}
            </p>

            {/* Time Expired Notice (if applicable) */}
            {isTimeExpired && (
              <div className="bg-orange-500/10 rounded-lg p-6 border border-orange-500/20 mb-6">
                <div className="flex items-center gap-3 justify-center mb-2">
                  <Clock className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-semibold text-foreground">Time's Up!</h3>
                </div>
                <p className="text-muted-foreground">
                  The exam timer reached 0:00 and your responses were automatically submitted. All progress has been
                  saved and recorded.
                </p>
              </div>
            )}

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-primary/10 rounded-lg p-6 border border-primary/20">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Submission Time</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{new Date().toLocaleTimeString()}</p>
                <p className="text-sm text-muted-foreground mt-1">{new Date().toLocaleDateString()}</p>
              </div>

              <div className="bg-green-500/10 rounded-lg p-6 border border-green-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <h3 className="text-sm font-semibold text-foreground">Status</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {isTimeExpired ? 'Auto-Submitted' : 'Completed'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isTimeExpired ? 'Submitted at time expiration' : 'Your exam was submitted'}
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-muted/50 rounded-lg p-6 border border-border mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-3">What Happens Next?</h3>
              <ul className="text-left text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Your instructor will review your submission</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Multiple-choice questions were graded automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Text responses will be manually reviewed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Results will be available from your instructor</span>
                </li>
              </ul>
            </div>

            {/* Logout Button */}
            <button onClick={handleLogout} className="btn btn-primary w-full flex items-center justify-center gap-2">
              <LogOut className="w-5 h-5" />
              <span>Return to Login</span>
            </button>
          </div>
        ) : (
          /* Violation Termination Card */
          <div className="card text-center animate-fade-in">
            {/* Warning Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-destructive/10 rounded-full mb-6 animate-shake">
              <AlertTriangle className="w-12 h-12 text-destructive" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-destructive mb-4">Exam Terminated</h1>

            {/* Message */}
            <p className="text-lg text-foreground mb-8">
              Your exam session has been terminated due to exceeding the maximum number of allowed violations.
            </p>

            {/* Information Card */}
            <div className="bg-destructive/10 rounded-lg p-6 border border-destructive/20 mb-8">
              <div className="flex items-center gap-3 justify-center mb-3">
                <AlertTriangle className="w-6 h-6 text-destructive" />
                <h3 className="text-lg font-semibold text-foreground">Automatic Submission</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                The proctoring system detected multiple violations during your exam. Your responses up to this point have
                been automatically submitted.
              </p>
              <p className="text-sm text-destructive font-medium">
                Please contact your instructor if you believe this was in error.
              </p>
            </div>

            {/* Violation Types Info */}
            <div className="bg-muted/50 rounded-lg p-6 border border-border mb-8 text-left">
              <h3 className="text-lg font-semibold text-foreground mb-3">Common Violations Include:</h3>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Switching tabs or windows</li>
                <li>• Opening developer tools</li>
                <li>• Copying or pasting text</li>
                <li>• Right-clicking on the page</li>
                <li>• Using keyboard shortcuts</li>
              </ul>
            </div>

            {/* Logout Button */}
            <button onClick={handleLogout} className="btn btn-danger w-full flex items-center justify-center gap-2">
              <LogOut className="w-5 h-5" />
              <span>Return to Login</span>
            </button>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>You can close this window now or return to the login page.</p>
        </div>
      </div>
    </div>
  );
}
