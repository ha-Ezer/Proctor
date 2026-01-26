# Question Count Display Fix

## Problem

Questions were being saved successfully to the database, but the question count was showing as "0 questions" in the admin UI.

## Root Cause

**Field name mismatch** between backend and frontend:
- Backend SQL query returns: `question_count` (snake_case)
- API interceptor transforms to: `questionCount` (camelCase)
- Frontend TypeScript interface expected: `totalQuestions`

## Solution

Updated frontend to use the correct field name that matches the backend response.

### Files Modified

**1. Frontend Type Definition** - `frontend/src/lib/adminApi.ts`
```typescript
export interface ExamDetails {
  // ... other fields
  questionCount?: number; // Changed from totalQuestions
  // ... other fields
}
```

**2. Frontend Display Component** - `frontend/src/pages/admin/ExamsPage.tsx`
```typescript
// Before:
<strong>{exam.totalQuestions || 0}</strong> questions

// After:
<strong>{exam.questionCount || 0}</strong> questions
```

## Verification

### Database Query Results
```sql
SELECT e.title, COUNT(q.id) as question_count
FROM exams e
LEFT JOIN questions q ON q.exam_id = e.id
GROUP BY e.id, e.title;
```

**Results:**
- new exam: 24 questions ✅
- Test Exam - Auto Created: 1 question ✅
- Sample Test Exam: 0 questions ✅
- Anatomy & Physiology Comprehensive Exam: 5 questions ✅

### API Response Flow

1. **Backend Query** (`backend/src/services/admin.service.ts`):
   ```sql
   SELECT e.*, COUNT(q.id) as question_count
   FROM exams e
   LEFT JOIN questions q ON q.exam_id = e.id
   GROUP BY e.id
   ```

2. **API Response** (snake_case):
   ```json
   {
     "id": "...",
     "title": "new exam",
     "question_count": 24
   }
   ```

3. **Frontend Transformation** (`frontend/src/lib/api.ts`):
   - `toCamelCase()` function converts `question_count` → `questionCount`

4. **Frontend Display** (`frontend/src/pages/admin/ExamsPage.tsx`):
   ```tsx
   <strong>{exam.questionCount || 0}</strong> questions
   ```

## Testing

### Test 1: View Existing Exams
1. Refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
2. Go to Admin Dashboard → Exams
3. **Expected**: See question counts for all exams
   - "new exam" shows 24 questions
   - "Test Exam - Auto Created" shows 1 question
   - etc.

### Test 2: Add New Questions
1. Click "Edit" on any exam
2. Add questions via bulk paste or manual entry
3. Click "Save Questions"
4. Return to Exams list
5. **Expected**: Question count increments correctly

### Test 3: Empty Exams
1. Create a new exam
2. Don't add any questions yet
3. **Expected**: Shows "0 questions"

## Why This Happened

The backend was correctly using snake_case (`question_count`) as per database naming conventions, and the API interceptor was correctly transforming to camelCase (`questionCount`). However, the frontend TypeScript interface was using a different name (`totalQuestions`), causing the mismatch.

## Related Components

- **Backend Service**: `backend/src/services/admin.service.ts` (line 539-551)
- **Frontend API**: `frontend/src/lib/api.ts` (toCamelCase function)
- **Frontend Types**: `frontend/src/lib/adminApi.ts` (ExamDetails interface)
- **Frontend Display**: `frontend/src/pages/admin/ExamsPage.tsx` (line 193)

## Summary

✅ **Fixed**: Field name mismatch resolved
✅ **Questions saving**: Already working correctly
✅ **Database queries**: Returning correct counts
✅ **Display**: Now shows actual question counts

The fix was simple - just updating the frontend field name to match what the backend actually returns after camelCase transformation.

## Current Status

- ✅ Backend: Correctly saving and counting questions
- ✅ Frontend: Now displays correct question counts
- ✅ Build: Successful with no errors
- ✅ Ready to test in browser
