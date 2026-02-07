import { useState } from 'react';
import { ChevronLeft, ChevronRight, Send, ImageOff } from 'lucide-react';
import { Question } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  response: { responseText?: string; responseOptionIndex?: number } | undefined;
  onResponseChange: (answer: { responseText?: string; responseOptionIndex?: number }) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  onSubmit: () => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  response,
  onResponseChange,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  onSubmit,
}: QuestionCardProps) {
  const [imageError, setImageError] = useState(false);

  // Transform and validate image URL
  const transformImageUrl = (url: string): string | null => {
    if (!url || url.trim() === '') {
      return null;
    }

    // Convert local attachments/ paths to /images/
    if (url.startsWith('attachments/')) {
      return url.replace('attachments/', '/images/');
    }

    // Allow data:image and http/https (CDNs often use query params, no file extension)
    if (url.startsWith('data:image') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Allow relative paths with image extension or /images/
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const urlLower = url.toLowerCase();
    if (imageExtensions.some(ext => urlLower.includes(ext)) || url.startsWith('/images/')) {
      return url;
    }

    console.warn('[QuestionCard] Invalid image URL (unsupported format):', url);
    return null;
  };

  const imageUrl = transformImageUrl(question.imageUrl || '');

  // Debug logging
  console.log('[QuestionCard] Q' + questionNumber + ':', {
    hasImageUrl: !!question.imageUrl,
    originalUrl: question.imageUrl,
    transformedUrl: imageUrl,
    imageError,
    showImage: !!(question.imageUrl && imageUrl && !imageError),
    showPlaceholder: !!(question.imageUrl && (imageError || !imageUrl))
  });

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-sm font-medium">
            Question {questionNumber} of {totalQuestions}
          </Badge>
          {question.required && (
            <Badge variant="destructive" className="text-xs">
              Required
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl leading-relaxed">{question.questionText}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Question Image */}
        {question.imageUrl && imageUrl && !imageError && (
          <div className="bg-muted rounded-lg p-4 border border-border">
            <img
              src={imageUrl}
              alt={`Question ${questionNumber} illustration`}
              className="max-w-full h-auto rounded-lg mx-auto"
              loading="lazy"
              onError={() => {
                console.error('[QuestionCard] Failed to load image:', imageUrl);
                setImageError(true);
              }}
            />
          </div>
        )}

        {/* Image Error Placeholder */}
        {question.imageUrl && (imageError || !imageUrl) && (
          <div className="bg-muted rounded-lg p-8 border border-border">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <ImageOff className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">Image not available</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{question.imageUrl}</p>
            </div>
          </div>
        )}

        {/* Answer Input */}
        <div>
          {/* Multiple Choice */}
          {question.questionType === 'multiple-choice' && (
            <div className="space-y-3">
              {question.options?.map((option) => (
                <label
                  key={option.index}
                  className={cn(
                    "radio-option",
                    response?.responseOptionIndex === option.index && "selected"
                  )}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={response?.responseOptionIndex === option.index}
                    onChange={() => onResponseChange({ responseOptionIndex: option.index })}
                    className="w-5 h-5 text-primary focus:ring-primary flex-shrink-0"
                  />
                  <span className="text-foreground flex-1">{option.text}</span>
                </label>
              ))}
            </div>
          )}

          {/* Text Input */}
          {question.questionType === 'text' && (
            <Input
              type="text"
              value={response?.responseText || ''}
              onChange={(e) => onResponseChange({ responseText: e.target.value })}
              placeholder={question.placeholder || 'Type your answer here...'}
              aria-label={`Answer for question ${questionNumber}`}
            />
          )}

          {/* Textarea Input */}
          {question.questionType === 'textarea' && (
            <textarea
              value={response?.responseText || ''}
              onChange={(e) => onResponseChange({ responseText: e.target.value })}
              placeholder={question.placeholder || 'Type your answer here...'}
              rows={8}
              className="textarea custom-scrollbar"
              aria-label={`Answer for question ${questionNumber}`}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <Button
            onClick={onPrevious}
            disabled={isFirst}
            variant="outline"
            aria-label="Previous question"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {isLast ? (
            <Button onClick={onSubmit} aria-label="Submit exam">
              <Send className="w-4 h-4 mr-2" />
              Submit Exam
            </Button>
          ) : (
            <Button onClick={onNext} aria-label="Next question">
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
