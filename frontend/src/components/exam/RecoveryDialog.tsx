import { RefreshCw, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface RecoveryDialogProps {
  recoveryData: {
    session: any;
    snapshot: {
      responses: Record<string, any>;
      violations: number;
      completionPercentage: number;
      currentQuestionIndex: number;
      timeRemaining: number;
    };
    recoveryTimestamp: string;
    timeElapsed: number;
    minimumTimeRemaining: number;
  };
  onAccept: () => void;
  onDecline: () => void;
}

export function RecoveryDialog({ recoveryData, onAccept, onDecline }: RecoveryDialogProps) {
  const { snapshot, timeElapsed, minimumTimeRemaining } = recoveryData;
  const answeredCount = Object.keys(snapshot.responses || {}).length;
  const timeElapsedStr = formatDuration(timeElapsed);
  const minTimeStr = formatDuration(minimumTimeRemaining);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-2xl max-w-md w-full animate-fade-in border border-border">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Resume Your Exam</h2>
              <p className="text-sm text-muted-foreground">We found your previous progress</p>
            </div>
          </div>

          {/* Recovery Information */}
          <div className="space-y-4 mb-6">
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <h3 className="text-sm font-semibold text-foreground mb-3">Recovered Progress:</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Questions Answered</span>
                  </div>
                  <span className="font-semibold text-foreground">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    <span>Violations</span>
                  </div>
                  <span className="font-semibold text-foreground">{snapshot.violations || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Time Elapsed</span>
                  </div>
                  <span className="font-semibold text-foreground">{timeElapsedStr}</span>
                </div>
              </div>
            </div>

            {/* Guaranteed Time Notice */}
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Guaranteed Time</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You'll have at least <strong className="text-foreground">{minTimeStr}</strong> to complete the exam.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onAccept}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Resume Exam</span>
            </button>
            <button
              onClick={onDecline}
              className="btn btn-secondary w-full"
            >
              Start Fresh (Discard Progress)
            </button>
          </div>

          {/* Warning */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              If you start fresh, your previous answers will be lost.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
