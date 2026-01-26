# Proctored Exam System - Frontend

React + TypeScript + Vite frontend for the proctored exam system.

## 🎯 Overview

This is the student-facing exam interface with comprehensive proctoring capabilities.

## ✅ Completed Components

### Core Infrastructure
- ✅ **Project Setup**: Vite + React + TypeScript + Tailwind CSS
- ✅ **State Management**: Zustand store for exam state
- ✅ **API Layer**: Axios-based API client with auth interceptors
- ✅ **Storage**: LocalStorage and SessionStorage wrappers
- ✅ **Utilities**: Time formatting, debounce, throttle, browser info

### Hooks (Critical - All Implemented)
- ✅ **useProctoring**: Detects all 10 violation types
  - Tab switch detection
  - Window blur detection
  - Right-click prevention
  - F12 / Dev tools detection
  - Ctrl+Shift+I/J/C detection
  - Ctrl+U view source detection
  - Paste detection with character count
  - Copy detection
  - Keyboard shortcut detection
  - DevTools size anomaly detection

- ✅ **useAutoSave**: Auto-saves every 5 seconds
  - Debounced save on user input
  - Force save on page unload
  - SessionStorage backup
  - Backend snapshot API integration

- ✅ **useTimer**: Countdown timer
  - Start/pause/reset controls
  - Time formatting (HH:MM:SS)
  - Critical/danger states
  - Auto-submit on expiration

### Pages
- ✅ **LoginPage**: Student authentication
  - Email + Full Name form
  - Form validation with Zod
  - Error handling
  - Responsive design

- ✅ **ExamPage**: Main exam interface (logic complete)
  - Session initialization
  - Recovery detection
  - Proctoring integration
  - Auto-save integration
  - Timer integration
  - Submit handling

### Styling
- ✅ **Tailwind Configuration**: Custom colors and animations
- ✅ **CSS Variables**: Migrated from existing system
- ✅ **Component Classes**: Buttons, cards, inputs, radio buttons
- ✅ **Animations**: Fade-in, slide-in, shake effects

## 📦 Components Still Needed

### Exam Components (To Be Created)

These components are referenced in ExamPage but need to be implemented:

1. **ExamHeader** (`src/components/exam/ExamHeader.tsx`)
   - Display exam title
   - Show student name
   - Display timer with color states
   - Show progress bar
   - Show violation counter

2. **QuestionCard** (`src/components/exam/QuestionCard.tsx`)
   - Render question text
   - Display question image (if any)
   - Render answer input based on type:
     - Multiple choice radio buttons
     - Text input field
     - Textarea for long answers
   - Navigation buttons (Previous/Next/Submit)
   - Question number indicator

3. **QuestionNavigation** (`src/components/exam/QuestionNavigation.tsx`)
   - Grid of question numbers
   - Color coding:
     - Current question (blue)
     - Answered (green)
     - Unanswered (gray)
   - Click to jump to question

4. **RecoveryDialog** (`src/components/exam/RecoveryDialog.tsx`)
   - Show recovery data summary
   - Display time elapsed
   - Show answered questions count
   - Violations count
   - Accept/Decline buttons

5. **ViolationAlert** (`src/components/exam/ViolationAlert.tsx`)
   - Toast notification for violations
   - Show violation type
   - Display current count / max count
   - Auto-dismiss after 5 seconds
   - Color-coded by severity

6. **SubmitDialog** (`src/components/exam/SubmitDialog.tsx`)
   - Confirmation dialog before submit
   - Show answered vs unanswered count
   - Warning if questions unanswered
   - Confirm/Cancel buttons
   - Loading state during submission

### Additional Pages

7. **CompletePage** (`src/pages/CompletePage.tsx`)
   - Thank you message
   - Display submission type
   - Show final statistics
   - Return to login button

### Router Setup

8. **App.tsx** and **main.tsx**
   - React Router setup
   - Route definitions
   - Protected route logic

## 🚀 Installation

```bash
cd frontend
npm install
```

## 🔧 Configuration

Copy `.env.example` to `.env` and configure:

```env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_PROCTORING=true
VITE_MAX_VIOLATIONS=7
VITE_AUTOSAVE_INTERVAL_MS=5000
VITE_MIN_RECOVERY_TIME_MS=300000
```

## 🏃 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Component Implementation Guide

### Example: ExamHeader Component

```tsx
// src/components/exam/ExamHeader.tsx
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
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Exam Title */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{examTitle}</h1>
            <p className="text-sm text-gray-600">{studentName}</p>
          </div>

          {/* Timer */}
          <div className={`timer ${timer.isDanger ? 'timer-danger' : timer.isCritical ? 'timer-warning' : 'timer-normal'}`}>
            {timer.formattedTime}
          </div>

          {/* Progress */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Violations */}
          <div className={`violation-badge ${violations >= maxViolations ? 'violation-badge-critical' : violations >= maxViolations * 0.7 ? 'violation-badge-high' : violations >= maxViolations * 0.4 ? 'violation-badge-medium' : 'violation-badge-low'}`}>
            <AlertTriangle className="w-4 h-4" />
            <span>{violations} / {maxViolations} Violations</span>
          </div>
        </div>
      </div>
    </header>
  );
}
```

### Example: QuestionCard Component

```tsx
// src/components/exam/QuestionCard.tsx
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

export function QuestionCard({ question, questionNumber, totalQuestions, response, onResponseChange, onNext, onPrevious, isFirst, isLast, onSubmit }: QuestionCardProps) {
  return (
    <div className="card">
      {/* Question Header */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">
          Question {questionNumber} of {totalQuestions}
        </div>
        <h2 className="text-xl font-medium text-gray-900">{question.questionText}</h2>
      </div>

      {/* Question Image */}
      {question.imageUrl && (
        <div className="mb-6">
          <img src={question.imageUrl} alt="Question" className="max-w-full h-auto rounded-lg" />
        </div>
      )}

      {/* Answer Input */}
      <div className="mb-8">
        {question.questionType === 'multiple-choice' && (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label key={option.index} className={`radio-option ${response?.responseOptionIndex === option.index ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={question.id}
                  checked={response?.responseOptionIndex === option.index}
                  onChange={() => onResponseChange({ responseOptionIndex: option.index })}
                  className="w-5 h-5 text-primary-600"
                />
                <span className="text-gray-900">{option.text}</span>
              </label>
            ))}
          </div>
        )}

        {question.questionType === 'text' && (
          <input
            type="text"
            value={response?.responseText || ''}
            onChange={(e) => onResponseChange({ responseText: e.target.value })}
            placeholder={question.placeholder}
            className="input"
          />
        )}

        {question.questionType === 'textarea' && (
          <textarea
            value={response?.responseText || ''}
            onChange={(e) => onResponseChange({ responseText: e.target.value })}
            placeholder={question.placeholder}
            rows={6}
            className="textarea"
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button onClick={onPrevious} disabled={isFirst} className="btn btn-secondary" disabled={isFirst}>
          Previous
        </button>

        {isLast ? (
          <button onClick={onSubmit} className="btn btn-primary">
            Submit Exam
          </button>
        ) : (
          <button onClick={onNext} className="btn btn-primary">
            Next Question
          </button>
        )}
      </div>
    </div>
  );
}
```

## 🔐 Security Features

- **JWT Authentication**: Token stored in localStorage
- **Token Expiration Handling**: Auto-redirect to login
- **CORS**: Configured for backend communication
- **No Right-Click**: Prevented via proctoring
- **No DevTools**: Detected and logged as violation
- **No Tab Switching**: Tracked as violation
- **No Copy/Paste**: Logged with character count

## 📊 Proctoring Violations

All 10 violation types from the original system:

1. **exam_started** - Session initialized
2. **exam_resumed** - Recovery after interruption
3. **tab_switch** - User switched tabs
4. **window_blur** - Window lost focus
5. **right_click** - Right-click attempted
6. **developer_tools** - Dev tools opened (F12, Ctrl+Shift+I/J/C)
7. **view_source** - Ctrl+U attempted
8. **paste_detected** - Text pasted (with character count)
9. **copy_detected** - Text copied
10. **keyboard_shortcut** - Suspicious shortcut detected

## 🔄 Auto-Save Mechanism

- Saves every 5 seconds automatically
- Debounced save on user input (2 seconds)
- Force save on page unload
- Saves to both backend and sessionStorage
- Includes: responses, violations, progress, current question, time remaining

## 🚨 Recovery System

- Detects interrupted sessions
- Shows recovery dialog with:
  - Time elapsed
  - Answered questions count
  - Violations count
  - Minimum 5 minutes guaranteed
- User can accept or decline recovery

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS breakpoints
- Works on tablets and phones
- Optimized for desktop exams

## 🎨 Theme

- Primary color: Sky blue (#0ea5e9)
- Danger color: Red (#ef4444)
- Success color: Green (#10b981)
- Warning color: Amber (#f59e0b)

## 🧪 Testing Checklist

- [ ] Login with authorized email
- [ ] Login with unauthorized email (should fail)
- [ ] Exam loads with all questions
- [ ] Multiple choice selection works
- [ ] Text input works
- [ ] Textarea works
- [ ] Timer counts down
- [ ] Timer shows warning at 5 minutes
- [ ] Timer shows danger at 1 minute
- [ ] Auto-save triggers every 5 seconds
- [ ] Tab switch logs violation
- [ ] Right-click prevented
- [ ] F12 prevented
- [ ] Paste detected and logged
- [ ] Copy detected and logged
- [ ] Page refresh shows recovery dialog
- [ ] Recovery restores responses
- [ ] Recovery restores violations
- [ ] Recovery restores time (min 5 minutes)
- [ ] Navigation between questions works
- [ ] Progress bar updates
- [ ] Violation counter updates
- [ ] Submit dialog appears
- [ ] Submit works
- [ ] Time expiration auto-submits
- [ ] Max violations auto-terminates

## 📦 Dependencies

### Core
- react ^18.2.0
- react-dom ^18.2.0
- react-router-dom ^6.21.1

### State & Forms
- zustand ^4.4.7
- react-hook-form ^7.49.3
- @hookform/resolvers ^3.3.4
- zod ^3.22.4

### API & HTTP
- axios ^1.6.5

### UI & Styling
- tailwindcss ^3.4.1
- lucide-react ^0.303.0
- clsx ^2.1.0
- tailwind-merge ^2.2.0

### Build Tools
- vite ^5.0.11
- @vitejs/plugin-react ^4.2.1
- typescript ^5.3.3

## 🚀 Deployment (Vercel)

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   VITE_ENABLE_PROCTORING=true
   VITE_MAX_VIOLATIONS=7
   ```
4. Deploy

## 🔗 Backend API

See backend API documentation for endpoint details:
- `POST /api/auth/student/login`
- `GET /api/exams/active`
- `POST /api/sessions/start`
- `POST /api/responses/save`
- `POST /api/violations/log`
- And more...

## 📝 Next Steps

To complete the frontend:

1. Create the 6 missing components listed above
2. Set up React Router in App.tsx
3. Create main.tsx entry point
4. Test all proctoring features
5. Deploy to Vercel

## 💡 Tips

- The ExamPage logic is complete - just needs the UI components
- All hooks are fully implemented and tested patterns
- The API client handles auth and errors automatically
- Use the existing CSS classes for consistent styling
- Lucide React icons are available for all UI elements
