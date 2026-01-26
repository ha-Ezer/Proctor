import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Clock, LogOut } from 'lucide-react';
import { clearAllExamData } from '@/lib/utils';
import { useExamStore } from '@/stores/examStore';

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        {!isViolationTermination ? (
          <div className="card text-center animate-fade-in">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 rounded-full mb-6">
              <CheckCircle2 className="w-12 h-12 text-success-600" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {isTimeExpired ? 'Time Expired - Exam Submitted' : 'Exam Submitted Successfully!'}
            </h1>

            {/* Message */}
            <p className="text-lg text-gray-600 mb-8">
              {isTimeExpired
                ? 'Your exam time has expired. Your progress has been automatically saved and submitted.'
                : 'Thank you for completing the exam. Your responses have been recorded and submitted.'}
            </p>

            {/* Time Expired Notice (if applicable) */}
            {isTimeExpired && (
              <div className="bg-amber-50 rounded-lg p-6 border border-amber-200 mb-6">
                <div className="flex items-center gap-3 justify-center mb-2">
                  <Clock className="w-6 h-6 text-amber-600" />
                  <h3 className="text-lg font-semibold text-amber-900">Time's Up!</h3>
                </div>
                <p className="text-gray-700">
                  The exam timer reached 0:00 and your responses were automatically submitted. All progress has been
                  saved and recorded.
                </p>
              </div>
            )}

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-primary-600" />
                  <h3 className="text-sm font-semibold text-primary-900">Submission Time</h3>
                </div>
                <p className="text-2xl font-bold text-primary-700">{new Date().toLocaleTimeString()}</p>
                <p className="text-sm text-primary-600 mt-1">{new Date().toLocaleDateString()}</p>
              </div>

              <div className="bg-success-50 rounded-lg p-6 border border-success-200">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-6 h-6 text-success-600" />
                  <h3 className="text-sm font-semibold text-success-900">Status</h3>
                </div>
                <p className="text-2xl font-bold text-success-700">
                  {isTimeExpired ? 'Auto-Submitted' : 'Completed'}
                </p>
                <p className="text-sm text-success-600 mt-1">
                  {isTimeExpired ? 'Submitted at time expiration' : 'Your exam was submitted'}
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What Happens Next?</h3>
              <ul className="text-left text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>Your instructor will review your submission</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>Multiple-choice questions were graded automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>Text responses will be manually reviewed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-danger-100 rounded-full mb-6 animate-shake">
              <AlertTriangle className="w-12 h-12 text-danger-600" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-danger-900 mb-4">Exam Terminated</h1>

            {/* Message */}
            <p className="text-lg text-gray-700 mb-8">
              Your exam session has been terminated due to exceeding the maximum number of allowed violations.
            </p>

            {/* Information Card */}
            <div className="bg-danger-50 rounded-lg p-6 border border-danger-200 mb-8">
              <div className="flex items-center gap-3 justify-center mb-3">
                <AlertTriangle className="w-6 h-6 text-danger-600" />
                <h3 className="text-lg font-semibold text-danger-900">Automatic Submission</h3>
              </div>
              <p className="text-gray-700 mb-4">
                The proctoring system detected multiple violations during your exam. Your responses up to this point have
                been automatically submitted.
              </p>
              <p className="text-sm text-danger-700 font-medium">
                Please contact your instructor if you believe this was in error.
              </p>
            </div>

            {/* Violation Types Info */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-8 text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Common Violations Include:</h3>
              <ul className="text-gray-700 space-y-1 text-sm">
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
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>You can close this window now or return to the login page.</p>
        </div>
      </div>
    </div>
  );
}
