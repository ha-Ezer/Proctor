import { useEffect } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ViolationAlertProps {
  violationType: string;
  totalViolations: number;
  maxViolations: number;
  onClose: () => void;
}

const violationMessages: Record<string, string> = {
  tab_switch: 'You switched to another tab or application',
  window_blur: 'The exam window lost focus',
  right_click: 'Right-click is not allowed during the exam',
  developer_tools: 'Developer tools are not allowed',
  view_source: 'Viewing page source is not allowed',
  paste_detected: 'Pasting text is not allowed',
  copy_detected: 'Copying text has been logged',
  keyboard_shortcut: 'This keyboard shortcut is not allowed',
  exam_started: 'Exam session started',
  exam_resumed: 'Exam session resumed',
};

export function ViolationAlert({ violationType, totalViolations, maxViolations, onClose }: ViolationAlertProps) {
  const message = violationMessages[violationType] || 'A violation has been detected';
  const remainingViolations = maxViolations - totalViolations;
  const isCloseToLimit = remainingViolations <= 2;
  const isCritical = remainingViolations <= 0;

  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-28 right-4 z-[60] max-w-md animate-slide-in">
      <div
        className={`card ${
          isCritical
            ? 'bg-danger-50 border-danger-300 animate-shake'
            : isCloseToLimit
            ? 'bg-warning-50 border-warning-300'
            : 'bg-primary-50 border-primary-300'
        } shadow-lg`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              isCritical
                ? 'bg-danger-100'
                : isCloseToLimit
                ? 'bg-warning-100'
                : 'bg-primary-100'
            }`}
          >
            {isCritical || isCloseToLimit ? (
              <ShieldAlert
                className={`w-6 h-6 ${
                  isCritical ? 'text-danger-600' : 'text-warning-600'
                }`}
              />
            ) : (
              <AlertTriangle className="w-6 h-6 text-primary-600" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3
              className={`text-sm font-bold mb-1 ${
                isCritical
                  ? 'text-danger-900'
                  : isCloseToLimit
                  ? 'text-warning-900'
                  : 'text-primary-900'
              }`}
            >
              {isCritical ? 'EXAM TERMINATED' : isCloseToLimit ? 'WARNING: Final Violations' : 'Violation Detected'}
            </h3>
            <p
              className={`text-sm mb-2 ${
                isCritical
                  ? 'text-danger-800'
                  : isCloseToLimit
                  ? 'text-warning-800'
                  : 'text-primary-800'
              }`}
            >
              {message}
            </p>
            <div
              className={`text-xs font-medium ${
                isCritical
                  ? 'text-danger-700'
                  : isCloseToLimit
                  ? 'text-warning-700'
                  : 'text-primary-700'
              }`}
            >
              {isCritical ? (
                <span>Maximum violations reached. Your exam has been submitted.</span>
              ) : (
                <span>
                  Violations: {totalViolations} / {maxViolations}
                  {isCloseToLimit && (
                    <span className="ml-2 font-bold">
                      ({remainingViolations} remaining before termination)
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
              isCritical
                ? 'hover:bg-danger-100 text-danger-600'
                : isCloseToLimit
                ? 'hover:bg-warning-100 text-warning-600'
                : 'hover:bg-primary-100 text-primary-600'
            }`}
            aria-label="Close notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="progress-bar h-1">
            <div
              className={`h-full transition-all duration-300 ${
                isCritical
                  ? 'bg-danger-600'
                  : isCloseToLimit
                  ? 'bg-warning-600'
                  : 'bg-primary-600'
              }`}
              style={{ width: `${((maxViolations - totalViolations) / maxViolations) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
