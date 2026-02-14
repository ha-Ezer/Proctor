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
    <div className="fixed top-20 right-3 left-3 sm:left-auto sm:right-4 sm:max-w-md z-[60] animate-slide-in">
      <div
        className={`rounded-lg shadow-lg border p-6 transition-shadow ${
          isCritical
            ? 'border-destructive/50 animate-shake'
            : isCloseToLimit
            ? 'border-orange-500/50'
            : 'border-primary/50'
        }`}
        style={{
          backgroundColor: isCritical
            ? 'hsl(var(--card))'
            : isCloseToLimit
            ? 'hsl(var(--card))'
            : 'hsl(var(--card))',
        }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: isCritical
                ? 'hsl(var(--destructive) / 0.2)'
                : isCloseToLimit
                ? 'rgb(249 115 22 / 0.2)'
                : 'hsl(var(--primary) / 0.2)',
            }}
          >
            {isCritical || isCloseToLimit ? (
              <ShieldAlert
                className={`w-6 h-6 ${
                  isCritical ? 'text-destructive' : 'text-orange-600'
                }`}
              />
            ) : (
              <AlertTriangle className="w-6 h-6 text-primary" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3
              className={`text-sm font-bold mb-1 ${
                isCritical
                  ? 'text-destructive'
                  : isCloseToLimit
                  ? 'text-orange-600'
                  : 'text-primary'
              }`}
            >
              {isCritical ? 'EXAM TERMINATED' : isCloseToLimit ? 'WARNING: Final Violations' : 'Violation Detected'}
            </h3>
            <p
              className={`text-sm mb-2 ${
                isCritical
                  ? 'text-destructive'
                  : isCloseToLimit
                  ? 'text-orange-600'
                  : 'text-primary'
              }`}
            >
              {message}
            </p>
            <div
              className={`text-xs font-medium ${
                isCritical
                  ? 'text-destructive'
                  : isCloseToLimit
                  ? 'text-orange-600'
                  : 'text-primary'
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
                ? 'hover:bg-destructive/20 text-destructive'
                : isCloseToLimit
                ? 'hover:bg-orange-500/20 text-orange-600'
                : 'hover:bg-primary/20 text-primary'
            }`}
            aria-label="Close notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="progress-bar h-1">
            <div
              className={`h-full transition-all duration-300 ${
                isCritical
                  ? 'bg-destructive'
                  : isCloseToLimit
                  ? 'bg-orange-600'
                  : 'bg-primary'
              }`}
              style={{ width: `${((maxViolations - totalViolations) / maxViolations) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
