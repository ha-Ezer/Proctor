# Critical Fixes Applied and Remaining Issues

**Date**: January 27, 2026
**Status**: Partial Fix Applied - Production Issues Remain

---

## Issues Reported

### 1. ✅ FIXED: Snapshots Page Blank Screen

**Error**: `TypeError: Cannot read properties of undefined (reading 'toFixed')`

**Cause**: The `completion_percentage`, `responses_count`, and `violations_count` fields from the database were NULL/undefined for some snapshots.

**Fix Applied**:
- Added null coalescing operators in `SnapshotsPage.tsx`
- Changed: `snapshot.completion_percentage.toFixed(0)`
- To: `(snapshot.completion_percentage || 0).toFixed(0)`
- Applied same fix to `responses_count` and `violations_count`

**File Modified**: `frontend/src/pages/admin/SnapshotsPage.tsx` (lines 254, 260, 266)

**Status**: ✅ Fixed - Will no longer crash on null values

---

### 2. ❌ NOT FIXED: Broken Images in Exam

**Issue**: Images in exam questions appear as broken images

**Investigation**:
- The `QuestionCard.tsx` component correctly transforms image URLs
- Converts `attachments/` to `/images/`
- Example: `attachments/q1.jpg` → `/images/q1.jpg`

**Root Cause**: Images are not being served by the backend/frontend server

**Possible Solutions**:

#### Option A: Railway Static Files (Recommended)
If deploying to Railway, you need to:

1. **Upload images to Railway Volume**:
   ```bash
   # Create volume in Railway project
   # Mount at /app/public/images
   # Upload all files from attachments/ folder
   ```

2. **Configure backend to serve static files**:
   ```typescript
   // backend/src/server.ts or app.ts
   import express from 'express';
   import path from 'path';

   app.use('/images', express.static(path.join(__dirname, '../public/images')));
   ```

#### Option B: Cloud Storage (Better for Production)
Use S3, Cloudinary, or similar:

1. **Upload images to cloud storage**
2. **Update database image URLs**:
   ```sql
   UPDATE questions
   SET image_url = REPLACE(image_url, 'attachments/', 'https://your-cdn.com/images/')
   WHERE image_url LIKE 'attachments/%';
   ```

#### Option C: Frontend Public Folder (Development Only)
For local development:

1. **Copy images to frontend public folder**:
   ```bash
   mkdir frontend/public/images
   cp attachments/* frontend/public/images/
   ```

2. **Images will be served at**: `http://localhost:5173/images/`

**Files to Check**:
- `backend/src/server.ts` - Add static file serving
- `frontend/public/images/` - Verify images exist
- Database `questions` table - Verify image_url paths

**Status**: ❌ Requires Manual Fix

---

### 3. ❌ NOT FIXED: Exam Submission 500 Error

**Error**:
```
POST /api/sessions/7e5e74c2-1e65-45a9-8b99-78947ee9744f/submit 500 (Internal Server Error)
```

**Investigation**:
- Controller: `session.controller.ts` - completeSession method
- Service: `session.service.ts` - completeSession method
- Issue occurs during score calculation: `calculate_session_score($1)`

**Root Cause**: The `calculate_session_score` function likely doesn't exist in the production database

**Solution**:

#### Step 1: Verify Function Exists
Run this on production database:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'calculate_session_score';
```

#### Step 2: If Missing, Create Function
The function is defined in `database-schema.sql` (lines 502-530). Run this on production:

```sql
CREATE OR REPLACE FUNCTION calculate_session_score(p_session_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_questions INTEGER;
    correct_answers INTEGER;
    score DECIMAL;
BEGIN
    -- Count total questions
    SELECT COUNT(*) INTO total_questions
    FROM responses
    WHERE session_id = p_session_id;

    -- Count correct answers
    SELECT COUNT(*) INTO correct_answers
    FROM responses
    WHERE session_id = p_session_id AND is_correct = true;

    -- Calculate percentage
    IF total_questions > 0 THEN
        score := (correct_answers::DECIMAL / total_questions::DECIMAL) * 100;
    ELSE
        score := 0;
    END IF;

    RETURN ROUND(score, 2);
END;
$$ LANGUAGE plpgsql;
```

#### Step 3: Verify Other Functions
Check if these functions also exist:
- `update_session_stats(UUID)`
- `update_exam_session_timestamp()`

Run full schema if needed:
```bash
psql $DATABASE_URL < database-schema.sql
```

**Alternative Quick Fix (Temporary)**:
If you need immediate fix without database access, modify the service to handle missing function:

```typescript
// backend/src/services/session.service.ts
try {
  const scoreResult = await client.query('SELECT calculate_session_score($1) as score', [sessionId]);
  score = scoreResult.rows[0].score;
} catch (error) {
  console.warn('Score calculation function not available, using default score of 0');
  score = 0; // Or calculate manually
}
```

**Status**: ❌ Requires Database Fix

---

## Deployment Checklist

Before deploying to production, ensure:

### Database Functions
- [ ] `calculate_session_score` function exists
- [ ] `update_session_stats` function exists
- [ ] All triggers are created
- [ ] Run: `psql $DATABASE_URL < database-schema.sql`

### Static Files
- [ ] Images are accessible at `/images/` path
- [ ] Backend serves static files OR images are on CDN
- [ ] Test image loading: `curl https://your-api.com/images/q1.jpg`

### Data Integrity
- [ ] All `session_snapshots` have non-null `completion_percentage`
- [ ] All `session_snapshots` have non-null `responses_count`
- [ ] All `session_snapshots` have non-null `violations_count`
- [ ] Run:
   ```sql
   UPDATE session_snapshots
   SET completion_percentage = 0
   WHERE completion_percentage IS NULL;

   UPDATE session_snapshots
   SET responses_count = 0
   WHERE responses_count IS NULL;

   UPDATE session_snapshots
   SET violations_count = 0
   WHERE violations_count IS NULL;
   ```

---

## Testing Steps

### 1. Test Snapshots Page
1. Navigate to `/admin/snapshots`
2. Select an exam
3. Verify table loads without errors
4. Verify completion percentages display as "0%" for null values
5. Click "Clear All Snapshots" and verify confirmation modal

### 2. Test Image Loading
1. Start an exam as student
2. Navigate to questions with images
3. Verify images load correctly
4. Check browser console for 404 errors on image URLs

### 3. Test Exam Submission
1. Start an exam as student
2. Answer a few questions
3. Click "Submit Exam"
4. Verify submission succeeds (no 500 error)
5. Verify completion page shows
6. Check admin sessions page for completed session

---

## Quick Commands

### Check Database Functions (Railway)
```bash
railway run psql $DATABASE_URL -c "\df calculate_session_score"
```

### Re-run Database Schema (Railway)
```bash
railway run psql $DATABASE_URL < database-schema.sql
```

### Check Image Files (Local)
```bash
ls -la attachments/
ls -la frontend/public/images/
```

### Test Backend API (Production)
```bash
curl https://your-backend.railway.app/images/q1.jpg
```

---

## Files Modified

### Frontend:
1. **`frontend/src/pages/admin/SnapshotsPage.tsx`** (lines 254, 260, 266)
   - Added null coalescing for `responses_count`
   - Added null coalescing for `completion_percentage`
   - Added null coalescing for `violations_count`

---

## Root Cause Summary

1. **Snapshots Error**: Missing null checks on database fields ✅ Fixed
2. **Broken Images**: Images not served by backend ❌ Needs Fix
3. **Submission Error**: Missing database function ❌ Needs Fix

---

## Immediate Action Required

### Priority 1 (Critical - Breaks Exam Submission):
**Fix database functions**
```bash
# On Railway
railway run psql $DATABASE_URL < database-schema.sql
```

### Priority 2 (High - Poor UX):
**Fix image serving**
- Option A: Configure backend static files
- Option B: Upload to CDN
- Option C: Copy to frontend public folder (dev only)

### Priority 3 (Low - Already Fixed):
**Snapshots page** - Already handled with null checks

---

## Production Readiness

**Current Status**: ⚠️ NOT READY FOR PRODUCTION

**Blocking Issues**:
1. ❌ Exam submission fails with 500 error
2. ❌ Images don't load

**Non-Blocking Issues**:
1. ✅ Snapshots page fixed

**Recommendation**:
- Deploy database fixes immediately
- Configure image serving
- Test thoroughly before allowing student access

---

**Prepared By**: Claude Sonnet 4.5
**Date**: January 27, 2026
**Severity**: High - Exam submission is broken
**Action**: Database and image serving fixes required
