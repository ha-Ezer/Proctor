import { useState } from 'react';
import { ChevronLeft, ChevronRight, Send, ImageOff } from 'lucide-react';
import { Question } from '@/lib/api';

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

    // Check if URL has image extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const urlLower = url.toLowerCase();
    const hasImageExtension = imageExtensions.some(ext => urlLower.includes(ext));

    // If it doesn't look like an image URL, return null
    if (!hasImageExtension && !url.startsWith('data:image')) {
      console.warn('[QuestionCard] Invalid image URL (no image extension):', url);
      return null;
    }

    return url;
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
    <div className="card animate-fade-in">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary-600">
            Question {questionNumber} of {totalQuestions}
          </span>
          {question.required && <span className="text-xs text-danger-600 font-medium">* Required</span>}
        </div>
        <h2 className="text-xl font-medium text-gray-900 leading-relaxed">{question.questionText}</h2>
      </div>

      {/* Question Image */}
      {question.imageUrl && imageUrl && !imageError && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
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
        <div className="mb-6 bg-gray-100 rounded-lg p-8 border border-gray-300">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <ImageOff className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">Image not available</p>
            <p className="text-xs text-gray-400 mt-1">{question.imageUrl}</p>
          </div>
        </div>
      )}

      {/* Answer Input */}
      <div className="mb-8">
        {/* Multiple Choice */}
        {question.questionType === 'multiple-choice' && (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label
                key={option.index}
                className={`radio-option ${response?.responseOptionIndex === option.index ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={response?.responseOptionIndex === option.index}
                  onChange={() => onResponseChange({ responseOptionIndex: option.index })}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                />
                <span className="text-gray-900 flex-1">{option.text}</span>
              </label>
            ))}
          </div>
        )}

        {/* Text Input */}
        {question.questionType === 'text' && (
          <input
            type="text"
            value={response?.responseText || ''}
            onChange={(e) => onResponseChange({ responseText: e.target.value })}
            placeholder={question.placeholder || 'Type your answer here...'}
            className="input"
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
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onPrevious}
          disabled={isFirst}
          className={`btn btn-secondary flex items-center gap-2 ${isFirst ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Previous question"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>

        {isLast ? (
          <button onClick={onSubmit} className="btn btn-primary flex items-center gap-2" aria-label="Submit exam">
            <Send className="w-5 h-5" />
            <span>Submit Exam</span>
          </button>
        ) : (
          <button onClick={onNext} className="btn btn-primary flex items-center gap-2" aria-label="Next question">
            <span>Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
