import { Check, Circle } from 'lucide-react';
import { Question } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuestionNavigationProps {
  questions: Question[];
  responses: Record<string, any>;
  currentIndex: number;
  onQuestionSelect: (index: number) => void;
}

export function QuestionNavigation({ questions, responses, currentIndex, onQuestionSelect }: QuestionNavigationProps) {
  const answeredCount = Object.keys(responses).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="text-lg">Questions</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-border">
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{answeredCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Answered</div>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{unansweredCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Remaining</div>
          </div>
        </div>

        {/* Question Grid */}
        <div className="grid grid-cols-5 gap-2 mb-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {questions.map((question, index) => {
            const isAnswered = responses[question.id] !== undefined;
            const isCurrent = index === currentIndex;

            return (
              <button
                key={question.id}
                onClick={() => onQuestionSelect(index)}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-lg border-2 cursor-pointer transition-all font-medium",
                  isCurrent && "bg-primary border-primary text-primary-foreground",
                  isAnswered && !isCurrent && "bg-primary/10 border-primary text-primary",
                  !isAnswered && !isCurrent && "bg-card border-input text-foreground hover:border-primary hover:bg-accent"
                )}
                aria-label={`Go to question ${index + 1}`}
                aria-current={isCurrent ? 'true' : 'false'}
              >
                {isAnswered && !isCurrent ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <span>{index + 1}</span>
                ) : (
                  <Circle className="w-4 h-4" />
                )}
                {!isAnswered && !isCurrent && <span className="sr-only">{index + 1}</span>}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="space-y-2 text-sm pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded" />
            <span className="text-muted-foreground">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary/10 border-2 border-primary rounded flex items-center justify-center">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-muted-foreground">Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-input rounded" />
            <span className="text-muted-foreground">Not Answered</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
