import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Question } from '@/lib/api';

interface QuestionListProps {
  questions: Question[];
  responses: Record<string, { responseText?: string; responseOptionIndex?: number }>;
  onResponseChange: (questionId: string, answer: { responseText?: string; responseOptionIndex?: number }) => void;
}

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
    console.warn('[QuestionList] Invalid image URL (no image extension):', url);
    return null;
  }

  return url;
};

function QuestionImage({ imageUrl, questionNumber }: { imageUrl: string; questionNumber: number }) {
  const [imageError, setImageError] = useState(false);
  const transformedUrl = transformImageUrl(imageUrl);

  if (!transformedUrl || imageError) {
    return (
      <div className="mb-6 bg-gray-100 rounded-lg p-8 border border-gray-300">
        <div className="flex flex-col items-center justify-center text-gray-500">
          <ImageOff className="w-12 h-12 mb-3" />
          <p className="text-sm font-medium">Image not available</p>
          <p className="text-xs text-gray-400 mt-1">{imageUrl}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
      <img
        src={transformedUrl}
        alt={`Question ${questionNumber} illustration`}
        className="max-w-full h-auto rounded-lg mx-auto"
        loading="lazy"
        onError={() => {
          console.error('[QuestionList] Failed to load image:', transformedUrl);
          setImageError(true);
        }}
      />
    </div>
  );
}

export function QuestionList({ questions, responses, onResponseChange }: QuestionListProps) {
  return (
    <div className="space-y-8">
      {questions.map((question, index) => (
        <div key={question.id} id={`question-${question.id}`} className="card scroll-mt-24">
          {/* Question Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary-600">
                Question {index + 1} of {questions.length}
              </span>
              {question.required && (
                <span className="text-xs text-danger-600 font-medium">* Required</span>
              )}
            </div>
            <h2 className="text-xl font-medium text-gray-900 leading-relaxed">
              {question.questionText}
            </h2>
          </div>

          {/* Question Image */}
          {question.imageUrl && (
            <QuestionImage imageUrl={question.imageUrl} questionNumber={index + 1} />
          )}

          {/* Answer Input */}
          <div className="mb-2">
            {/* Multiple Choice */}
            {question.questionType === 'multiple-choice' && (
              <div className="space-y-3">
                {question.options?.map((option) => (
                  <label
                    key={option.index}
                    className={`radio-option ${
                      responses[question.id]?.responseOptionIndex === option.index ? 'selected' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={responses[question.id]?.responseOptionIndex === option.index}
                      onChange={() => onResponseChange(question.id, { responseOptionIndex: option.index })}
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
                value={responses[question.id]?.responseText || ''}
                onChange={(e) => onResponseChange(question.id, { responseText: e.target.value })}
                placeholder={question.placeholder || 'Type your answer here...'}
                className="input"
                aria-label={`Answer for question ${index + 1}`}
              />
            )}

            {/* Textarea Input */}
            {question.questionType === 'textarea' && (
              <textarea
                value={responses[question.id]?.responseText || ''}
                onChange={(e) => onResponseChange(question.id, { responseText: e.target.value })}
                placeholder={question.placeholder || 'Type your answer here...'}
                rows={8}
                className="textarea custom-scrollbar"
                aria-label={`Answer for question ${index + 1}`}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
