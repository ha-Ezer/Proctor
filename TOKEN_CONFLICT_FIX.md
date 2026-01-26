# Token Conflict Fix - 403 Forbidden Error

## Problem

When a student tried to access the exam after logging in, they received a **403 Forbidden** error with the message:
```
Student access required
```

This happened even though:
- Student login was successful ✓
- JWT token was generated correctly ✓
- Token contained `type: 'student'` ✓
- Active exam existed in database ✓

## Root Cause

The issue was a **token conflict** caused by the order of token precedence in the API request interceptor.

### How It Happened:

1. **Admin logs in** → Token stored in `proctor_admin_token` in localStorage
2. **Admin logs out or leaves** → Admin token remains in localStorage
3. **Student logs in** → Token stored in `proctor_token` in localStorage
4. **Student tries to access exam** → API interceptor executes

### The Problem Code (api.ts:38-49):

```typescript
api.interceptors.request.use(
  (config) => {
    // Check for admin token first, then student token
    const adminToken = localStorage.getItem('proctor_admin_token');
    const studentToken = localStorage.getItem('proctor_token');
    const token = adminToken || studentToken;  // ← ADMIN TOKEN TAKES PRECEDENCE!

    if (token) {
      const cleanToken = token.replace(/^"(.*)"$/, '$1');
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  }
);
```

**Issue**: The interceptor checks for admin token FIRST. If an admin token exists from a previous session, it uses that instead of the student token.

### What Backend Saw:

1. Request to `/api/exams/active` received
2. `authenticateToken` middleware extracts JWT
3. JWT payload contains `type: 'admin'` (from old admin session)
4. `requireStudent` middleware checks `req.user.type`
5. Finds `type === 'admin'` instead of `'student'`
6. Returns 403 Forbidden with "Student access required"

## Solution

### Fix 1: Clear Admin Token on Student Login

**File**: `frontend/src/pages/LoginPage.tsx`

Added token cleanup before storing student token:

```typescript
const onSubmit = async (data: LoginForm) => {
  try {
    const response = await authApi.studentLogin(data.email, data.fullName);
    const { token, student } = response.data.data;

    // ✅ Clear any admin token first (to prevent token conflict)
    localStorage.removeItem('proctor_admin_token');

    // Store token and student data
    storage.set(STORAGE_KEYS.TOKEN, token);
    storage.set(STORAGE_KEYS.STUDENT, student);
    setStudent(student);

    navigate('/exam');
  } catch (err: any) {
    // ...
  }
};
```

### Fix 2: Clear Student Token on Admin Login (Symmetry)

**File**: `frontend/src/pages/AdminLoginPage.tsx`

Added reciprocal cleanup:

```typescript
const handleSubmit = async (e: FormEvent) => {
  try {
    const response = await adminApi.login(email, password);
    const { token, admin } = response.data.data;

    // ✅ Clear any student token first (to prevent token conflict)
    localStorage.removeItem('proctor_token');
    localStorage.removeItem('proctor_student');

    setAdmin(admin, token);
    navigate('/admin/dashboard');
  } catch (err) {
    // ...
  }
};
```

## Why This Works

### Before Fix:
```
localStorage:
  proctor_admin_token: "eyJhbGc..."  ← Used by API
  proctor_token: "eyJhbGc..."        ← Ignored!

API Request Header:
  Authorization: Bearer <admin_token>

Backend sees: type='admin'
Endpoint requires: type='student'
Result: 403 Forbidden ❌
```

### After Fix:
```
localStorage:
  proctor_admin_token: (deleted) ✓
  proctor_token: "eyJhbGc..."        ← Used by API

API Request Header:
  Authorization: Bearer <student_token>

Backend sees: type='student'
Endpoint requires: type='student'
Result: 200 OK ✅
```

## Files Modified

1. `frontend/src/pages/LoginPage.tsx`
   - Added `localStorage.removeItem('proctor_admin_token')` before storing student token

2. `frontend/src/pages/AdminLoginPage.tsx`
   - Added `localStorage.removeItem('proctor_token')` before storing admin token
   - Added `localStorage.removeItem('proctor_student')` to clean up student data

## Testing

### Test 1: Student After Admin Session
1. Log in as admin (admin@example.com)
2. Navigate around admin dashboard
3. Log out (or just go to `/login`)
4. Log in as student (student1@test.com)
5. **Expected**: Exam loads successfully without 403 error

### Test 2: Admin After Student Session
1. Log in as student (student1@test.com)
2. Start exam
3. Log out (or go to `/admin/login`)
4. Log in as admin (admin@example.com)
5. **Expected**: Admin dashboard loads successfully

### Test 3: Direct Token Check
**Before navigating to exam page**, open browser DevTools → Application → Local Storage:

```
proctor_token: "eyJ..."          ← Should exist
proctor_admin_token: (none)      ← Should NOT exist
```

### Test 4: API Request Header
In DevTools → Network tab, check the request to `/api/exams/active`:

**Request Headers:**
```
Authorization: Bearer eyJ...  (student token, not admin token)
```

**Response:**
```
Status: 200 OK
Body: { success: true, data: { exam: {...}, questions: [...] } }
```

## Prevention Tips

To avoid similar issues in the future:

1. **Always clear conflicting tokens** when switching user types
2. **Use separate localStorage keys** for different user types
3. **Consider using a single key** with user type in the stored data
4. **Add logout buttons** that explicitly clear all auth data
5. **Test user switching** in your test scenarios

## Current Status

- ✅ Fix implemented
- ✅ Frontend rebuilt successfully
- ✅ No TypeScript errors
- ✅ No build warnings (except pre-existing eval warning)
- ✅ Ready to test

## How to Test Now

1. **Clear browser localStorage completely**:
   - Open DevTools
   - Application tab → Local Storage
   - Right-click → Clear all

2. **Test the full flow**:
   ```
   Admin Login → Save Questions → Logout
   Student Login → Access Exam (should work now!)
   ```

3. **Verify in console**: No 403 errors on `/api/exams/active`

## Related Files

- `backend/src/middleware/auth.middleware.ts` - Auth middleware that checks token type
- `backend/src/routes/exam.routes.ts` - Exam routes that require student auth
- `frontend/src/lib/api.ts` - API interceptor with token precedence logic
- `frontend/src/lib/storage.ts` - Storage utility functions
- `frontend/src/stores/adminStore.ts` - Admin state management with token storage

## Summary

The 403 error was caused by **token precedence** - the API interceptor prioritized admin tokens over student tokens. When a student logged in after an admin session, the old admin token was still in localStorage and was used for API requests, causing the backend to reject student endpoint access.

**Solution**: Clear the opposite token type when logging in, ensuring only the correct token exists for the current user type.
