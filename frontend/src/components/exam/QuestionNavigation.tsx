import { Check, Circle } from 'lucide-react';
import { Question } from '@/lib/api';

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
    <div className="card sticky top-24">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions</h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-gray-200">
        <div className="bg-primary-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-primary-700">{answeredCount}</div>
          <div className="text-xs text-primary-600 mt-1">Answered</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-700">{unansweredCount}</div>
          <div className="text-xs text-gray-600 mt-1">Remaining</div>
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
              className={`question-nav-item ${
                isCurrent ? 'current' : isAnswered ? 'answered' : 'unanswered'
              }`}
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
      <div className="space-y-2 text-sm pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary-600 rounded" />
          <span className="text-gray-600">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary-100 border-2 border-primary-600 rounded flex items-center justify-center">
            <Check className="w-3 h-3 text-primary-700" />
          </div>
          <span className="text-gray-600">Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 rounded" />
          <span className="text-gray-600">Not Answered</span>
        </div>
      </div>
    </div>
  );
}
