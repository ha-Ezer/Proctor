# Color Coding Session ID Fix

## Issue

When the same student took an exam multiple times (creating multiple sessions), color-coding one session's cell would automatically color the corresponding cell in all other sessions for that student. This happened because the color-coding system was keyed by `studentId` + `questionId` instead of `sessionId` + `questionId`.

## Root Cause

The `exam_report_cell_colors` table and all related code used `student_id` as the foreign key, meaning colors were shared across all sessions for the same student.

## Solution

Changed the color-coding system to use `session_id` instead of `student_id` as the unique identifier. This ensures that each exam session has its own independent color-coding, even if the same student takes the exam multiple times.

## Changes Made

### 1. Database Schema

**File**: `backend/database-migration-exam-report-colors-use-session-id.sql` (NEW)

- Dropped and recreated `exam_report_cell_colors` table
- Changed foreign key from `student_id` to `session_id`
- Updated unique constraint: `(exam_id, session_id, question_id)`
- Updated indexes to reference `session_id`

**Migration SQL**:
```sql
DROP TABLE IF EXISTS exam_report_cell_colors CASCADE;

CREATE TABLE exam_report_cell_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, session_id, question_id)
);
```

### 2. Frontend Changes

#### `frontend/src/lib/adminApi.ts`

**Changed interface**:
```typescript
export interface ExamReportCellColor {
  sessionId: string;  // Changed from studentId
  questionId: string;
  color: string;
}
```

**Updated API methods**:
```typescript
saveExamReportCellColor: (examId: string, sessionId: string, questionId: string, color: string)
deleteExamReportCellColor: (examId: string, sessionId: string, questionId: string)
```

#### `frontend/src/components/admin/ExamReportTable.tsx`

**Updated functions**:
- `getCellColor(sessionId, questionId)` - Changed parameter from `studentId` to `sessionId`
- `handleColorSelect(sessionId, questionId, color)` - Changed parameter from `studentId` to `sessionId`

**Updated JSX**:
- Table row key: `key={student.sessionId}` (was `key={student.studentId}`)
- Cell key: `key={student.sessionId}-${question.id}` (was `key={student.studentId}-${question.id}`)
- Color retrieval: `getCellColor(student.sessionId, question.id)`
- Color selection: `handleColorSelect(student.sessionId, question.id, colorOption.value)`

### 3. Backend Changes

#### `backend/src/controllers/admin.controller.ts`

**Changed parameter extraction**:
```typescript
// Before
const { studentId, questionId, color } = req.body;

// After
const { sessionId, questionId, color } = req.body;
```

#### `backend/src/services/admin.service.ts`

**Updated method signatures**:
- `saveExamReportCellColor(examId, sessionId, questionId, color)` - Changed from `studentId`
- `deleteExamReportCellColor(examId, sessionId, questionId)` - Changed from `studentId`
- `getExamReportCellColors(examId)` - Returns `session_id` instead of `student_id`

**Updated SQL queries**:

1. **Save color** (UPSERT):
```sql
INSERT INTO exam_report_cell_colors (exam_id, session_id, question_id, color)
VALUES ($1, $2, $3, $4)
ON CONFLICT (exam_id, session_id, question_id)
DO UPDATE SET color = $4, updated_at = CURRENT_TIMESTAMP
```

2. **Get colors**:
```sql
SELECT session_id, question_id, color
FROM exam_report_cell_colors
WHERE exam_id = $1
```

3. **Delete color**:
```sql
DELETE FROM exam_report_cell_colors
WHERE exam_id = $1 AND session_id = $2 AND question_id = $3
```

4. **Get exam report** (within `getExamReport` method):
```sql
SELECT session_id, question_id, color
FROM exam_report_cell_colors
WHERE exam_id = $1
```

## Testing Checklist

After deploying these changes:

- [ ] Run the database migration script
- [ ] Test color-coding on a single session
- [ ] Verify color persists after page refresh
- [ ] Have the same student take the same exam twice
- [ ] Color-code cells in the first session
- [ ] Verify the second session's cells remain uncolored
- [ ] Color-code cells in the second session independently
- [ ] Verify both sessions maintain their own colors
- [ ] Test removing colors (clicking same color twice)
- [ ] Verify colors are visible to all admin users

## Benefits

1. **Independent sessions**: Each exam session now has its own color-coding
2. **No conflicts**: Students can retake exams without color confusion
3. **Accurate tracking**: Admins can color-code each attempt independently
4. **Better data integrity**: Colors are tied to specific sessions, not students

## Breaking Changes

⚠️ **Existing color data will be lost** when running the migration script because the table is dropped and recreated with the new schema. If you need to preserve existing colors, you would need to:

1. Export existing colors with `student_id`
2. Map each `student_id` to their corresponding `session_id` from `exam_sessions`
3. Re-import colors with the new `session_id` values

However, since color-coding is metadata for grading/review (not critical exam data), it's acceptable to start fresh with the new schema.

## Deployment Steps

1. **Stop the backend server** (to prevent write conflicts during migration)
2. **Run the migration script**:
   ```bash
   psql -U your_user -d your_database -f backend/database-migration-exam-report-colors-use-session-id.sql
   ```
3. **Deploy updated backend code**
4. **Deploy updated frontend code**
5. **Verify functionality** with the testing checklist

---

**Status**: Complete ✅
**Build**: Frontend and Backend both successful ✅
**Migration Script**: Created ✅
**Date**: January 2026
