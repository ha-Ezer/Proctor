import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';

interface SubmitDialogProps {
  answeredCount: number;
  totalCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function SubmitDialog({ answeredCount, totalCount, onConfirm, onCancel, isSubmitting }: SubmitDialogProps) {
  const unansweredCount = totalCount - answeredCount;
  const hasUnanswered = unansweredCount > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-2xl max-w-md w-full animate-fade-in border border-border">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                hasUnanswered ? 'bg-orange-500/10' : 'bg-primary/10'
              }`}
            >
              {hasUnanswered ? (
                <AlertCircle className={`w-6 h-6 ${hasUnanswered ? 'text-orange-600' : 'text-primary'}`} />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Submit Exam?</h2>
              <p className="text-sm text-muted-foreground">This action cannot be undone</p>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="space-y-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">{answeredCount}</div>
                  <div className="text-sm text-muted-foreground mt-1">Answered</div>
                </div>
                <div>
                  <div className={`text-3xl font-bold ${hasUnanswered ? 'text-orange-600' : 'text-muted-foreground'}`}>
                    {unansweredCount}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Unanswered</div>
                </div>
              </div>
            </div>

            {/* Warning for Unanswered Questions */}
            {hasUnanswered && (
              <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Incomplete Exam</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}. Are you
                      sure you want to submit?
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Message */}
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-start gap-2">
                <Send className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Ready to Submit?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Once submitted, you will not be able to make any changes to your answers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Yes, Submit Exam</span>
                </>
              )}
            </button>
            <button onClick={onCancel} disabled={isSubmitting} className="btn btn-secondary w-full">
              Cancel
            </button>
          </div>

          {/* Info Text */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">Your responses have been auto-saved continuously.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
