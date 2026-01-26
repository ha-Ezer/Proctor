import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';

interface ExamHeaderProps {
  examTitle: string;
  studentName: string;
  timer: {
    formattedTime: string;
    isDanger: boolean;
    isCritical: boolean;
  };
  progress: number;
  violations: number;
  maxViolations: number;
}

export function ExamHeader({ examTitle, studentName, timer, progress, violations, maxViolations }: ExamHeaderProps) {
  const violationPercentage = (violations / maxViolations) * 100;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Exam Title & Student */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">{examTitle}</h1>
            <p className="text-sm text-gray-600">{studentName}</p>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2">
            <Clock
              className={`w-5 h-5 ${
                timer.isDanger ? 'text-danger-600' : timer.isCritical ? 'text-warning-600' : 'text-gray-600'
              }`}
            />
            <span
              className={`timer ${
                timer.isDanger ? 'timer-danger' : timer.isCritical ? 'timer-warning' : 'timer-normal'
              }`}
            >
              {timer.formattedTime}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Progress</span>
              </div>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Violations Counter */}
          <div
            className={`violation-badge ${
              violations >= maxViolations
                ? 'violation-badge-critical'
                : violationPercentage >= 70
                ? 'violation-badge-high'
                : violationPercentage >= 40
                ? 'violation-badge-medium'
                : 'violation-badge-low'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold">
              {violations} / {maxViolations}
            </span>
            <span className="hidden sm:inline">Violations</span>
          </div>
        </div>
      </div>
    </header>
  );
}
