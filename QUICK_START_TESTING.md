# Quick Start Testing Guide

## Prerequisites Check

Before we can test the frontend, we need:
- ✅ Node.js 18+ installed
- ✅ PostgreSQL installed (for database)
- ⏳ Backend running
- ⏳ Database set up

## Option 1: Quick Demo Test (Without Full Backend)

If you just want to see the frontend UI without full functionality:

### Step 1: Start Frontend Only
```bash
cd frontend
npm run dev
```

Visit http://localhost:5173

**What You Can Test**:
- ✅ Login page UI
- ✅ Form validation
- ❌ Actual login (needs backend)
- ❌ Exam interface (needs backend)

---

## Option 2: Full System Test (Recommended)

To test everything including proctoring, auto-save, etc., you need the full stack.

### Step 1: Set Up PostgreSQL Database

#### Option A: Use Local PostgreSQL
```bash
# Check if PostgreSQL is installed
psql --version

# If not installed on Mac:
brew install postgresql
brew services start postgresql

# Create database
createdb proctor_db

# Run schema
psql -d proctor_db -f /Users/pilgrim_13_1/.claude-worktrees/Proctor/relaxed-mirzakhani/database-schema.sql
```

#### Option B: Use Docker (Easier)
```bash
# Start PostgreSQL in Docker
docker run --name proctor-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=proctor_db \
  -p 5432:5432 \
  -d postgres:14

# Wait 5 seconds for it to start
sleep 5

# Run schema
docker exec -i proctor-db psql -U postgres -d proctor_db < /Users/pilgrim_13_1/.claude-worktrees/Proctor/relaxed-mirzakhani/database-schema.sql
```

### Step 2: Configure Backend

```bash
cd /Users/pilgrim_13_1/.claude-worktrees/Proctor/relaxed-mirzakhani/backend

# Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=proctor_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=test_jwt_secret_for_development_only
JWT_EXPIRATION=2h
ADMIN_JWT_EXPIRATION=24h

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
VIOLATION_RATE_LIMIT=20
AUTH_RATE_LIMIT=5

# Admin Email
ADMIN_EMAIL=admin@example.com

# Logging
LOG_LEVEL=info
EOF
```

### Step 3: Add Test Data (Students & Admin)

```bash
# Connect to database and add test data
psql -d proctor_db << 'EOF'
-- Add test students
INSERT INTO students (email, full_name, is_authorized) VALUES
('student1@test.com', 'Test Student 1', true),
('student2@test.com', 'Test Student 2', true),
('john@example.com', 'John Doe', true);

-- Add admin user (password: admin123)
INSERT INTO admin_users (email, password_hash, full_name, role, is_active) VALUES
('admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5v4UmKw5bvZF2', 'Admin User', 'super_admin', true);

-- Create a test exam
INSERT INTO exams (title, description, version, duration_minutes, max_violations, is_active)
VALUES ('Test Exam', 'A sample exam for testing', '1.0', 30, 7, true)
RETURNING id;
EOF
```

Copy the exam ID from the output above, you'll need it for the next step.

### Step 4: Add Test Questions

Replace `EXAM_ID_HERE` with the ID from the previous step:

```bash
psql -d proctor_db << 'EOF'
-- Replace this with your actual exam ID
\set exam_id 'YOUR_EXAM_ID_HERE'

-- Add a multiple-choice question
INSERT INTO questions (exam_id, question_number, question_text, question_type, required)
VALUES (:'exam_id', 1, 'What is 2 + 2?', 'multiple-choice', true)
RETURNING id;

-- Copy the question ID and use it below
\set q1_id 'YOUR_QUESTION_ID_HERE'

-- Add options for the multiple-choice question
INSERT INTO question_options (question_id, option_index, option_text, is_correct) VALUES
(:'q1_id', 0, '3', false),
(:'q1_id', 1, '4', true),
(:'q1_id', 2, '5', false),
(:'q1_id', 3, '6', false);

-- Add a text question
INSERT INTO questions (exam_id, question_number, question_text, question_type, required, placeholder)
VALUES (:'exam_id', 2, 'What is your favorite color?', 'text', true, 'Type your answer here...');

-- Add a textarea question
INSERT INTO questions (exam_id, question_number, question_text, question_type, required, placeholder)
VALUES (:'exam_id', 3, 'Explain what you learned today.', 'textarea', true, 'Type your detailed answer here...');
EOF
```

**OR** use the migration script to add all 50 questions:

```bash
cd /Users/pilgrim_13_1/.claude-worktrees/Proctor/relaxed-mirzakhani/backend
npm run migrate
```

### Step 5: Start Backend

```bash
cd /Users/pilgrim_13_1/.claude-worktrees/Proctor/relaxed-mirzakhani/backend
npm run dev
```

You should see:
```
🚀 Server running on port 3000
✅ Database connected successfully
```

### Step 6: Start Frontend (New Terminal)

Open a new terminal:

```bash
cd /Users/pilgrim_13_1/.claude-worktrees/Proctor/relaxed-mirzakhani/frontend
npm run dev
```

You should see:
```
  VITE v5.0.11  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

---

## Testing the Application

### Test 1: Login

1. Open http://localhost:5173
2. You'll see the login page
3. Try these credentials:
   - **Unauthorized email**: `test@test.com` → Should show error
   - **Authorized email**: `student1@test.com`, Full Name: `Test Student` → Should work

**Expected**:
- ✅ Validation works (email format, name length)
- ✅ Unauthorized email shows error message
- ✅ Authorized email logs in and redirects to /exam

### Test 2: Exam Interface

After successful login:

**Expected**:
- ✅ Header shows exam title, student name, timer (30:00), progress (0%)
- ✅ Violation counter shows 0/7
- ✅ First question is displayed
- ✅ Question sidebar shows all questions (gray/unanswered)
- ✅ Can answer the question
- ✅ "Next" button works

### Test 3: Question Types

Navigate through questions:

**Multiple Choice**:
- ✅ Radio buttons display
- ✅ Can select an option
- ✅ Selection is highlighted
- ✅ Question marked as answered (blue checkmark in sidebar)

**Text Input**:
- ✅ Text field displays
- ✅ Can type answer
- ✅ Placeholder shows

**Textarea**:
- ✅ Large text area displays
- ✅ Can type multi-line answer
- ✅ Placeholder shows

### Test 4: Auto-Save

1. Answer a question
2. Wait 5 seconds
3. Check browser console (F12)

**Expected**:
- ✅ Console shows "Progress snapshot saved" message
- ✅ No errors

### Test 5: Proctoring Violations

**IMPORTANT**: Test all 10 violation types

#### Test 5a: Tab Switch
1. Switch to another browser tab
2. Switch back

**Expected**:
- ✅ Violation alert appears (top-right)
- ✅ Shows "You switched to another tab"
- ✅ Counter increments (1/7)
- ✅ Alert auto-dismisses after 5 seconds

#### Test 5b: Right-Click
1. Try to right-click on the page

**Expected**:
- ✅ Context menu does NOT appear
- ✅ Violation alert shows
- ✅ Counter increments (2/7)

#### Test 5c: Developer Tools
1. Press F12

**Expected**:
- ✅ DevTools do NOT open
- ✅ Violation logged
- ✅ Counter increments (3/7)

#### Test 5d: Copy Text
1. Select some text
2. Press Ctrl+C (or Cmd+C)

**Expected**:
- ✅ Copy IS allowed (can't prevent)
- ✅ Violation logged with "Text copied"
- ✅ Counter increments (4/7)

#### Test 5e: Paste Text
1. Copy some text
2. Click in a text field
3. Press Ctrl+V (or Cmd+V)

**Expected**:
- ✅ Paste IS allowed
- ✅ Violation logged with character count
- ✅ Counter increments (5/7)

#### Test 5f: Window Blur
1. Click outside the browser window (on desktop)
2. Click back

**Expected**:
- ✅ Violation logged
- ✅ Counter increments (6/7)

#### Test 5g: Keyboard Shortcuts
1. Press Ctrl+Shift+I
2. Press Ctrl+U

**Expected**:
- ✅ Both blocked
- ✅ Violations logged
- ✅ Counter would reach 7/7 (exam terminates)

### Test 6: Session Recovery

1. Answer 3 questions
2. Wait for auto-save (5 seconds)
3. Refresh the page (F5)

**Expected**:
- ✅ Recovery dialog appears
- ✅ Shows "3 questions answered"
- ✅ Shows violation count
- ✅ Shows time elapsed
- ✅ "Resume Exam" button
- ✅ Click "Resume Exam"
- ✅ All 3 answers are restored
- ✅ Violations restored
- ✅ Can continue exam

### Test 7: Submission

1. Navigate to last question
2. Click "Submit Exam"

**Expected**:
- ✅ Submit dialog appears
- ✅ Shows answered/unanswered count
- ✅ Shows warning if incomplete
- ✅ Click "Yes, Submit Exam"
- ✅ Button shows loading spinner
- ✅ Redirects to /complete
- ✅ Shows success message
- ✅ "Return to Login" button works

### Test 8: Max Violations Termination

1. Start new exam
2. Trigger 7 violations (tab switch 7 times)

**Expected**:
- ✅ After 7th violation, exam auto-terminates
- ✅ Auto-submits
- ✅ Redirects to /complete?reason=violations
- ✅ Shows termination message (red icon)
- ✅ Explains violations exceeded

---

## Troubleshooting

### Issue: "Failed to fetch" error
**Solution**: Backend isn't running. Start it with `npm run dev` in backend folder.

### Issue: "UNAUTHORIZED_EMAIL"
**Solution**: Email not in authorized list. Add it to database:
```sql
INSERT INTO students (email, full_name, is_authorized)
VALUES ('your@email.com', 'Your Name', true);
```

### Issue: "NO_ACTIVE_EXAM"
**Solution**: No exam is marked as active. Run:
```sql
UPDATE exams SET is_active = true WHERE id = 'YOUR_EXAM_ID';
```

### Issue: Questions not loading
**Solution**: Add questions to the exam using migration script or manually.

### Issue: Auto-save not working
**Solution**: Check browser console for errors. Verify backend is running.

### Issue: Violations not being logged
**Solution**: Check browser console. Verify backend is running and session exists.

---

## Quick Reference

### Test Credentials
- **Student**: student1@test.com (Test Student 1)
- **Admin**: admin@example.com (password: admin123)

### Backend API
- Health Check: http://localhost:3000/health
- API Base: http://localhost:3000/api

### Frontend
- App: http://localhost:5173
- Login: http://localhost:5173/login
- Exam: http://localhost:5173/exam
- Complete: http://localhost:5173/complete

### Database
- Host: localhost
- Port: 5432
- Database: proctor_db
- User: postgres
- Password: postgres

---

## Success Criteria

A successful test means:
- ✅ Login works for authorized emails
- ✅ Exam loads with questions
- ✅ Can answer all question types
- ✅ Navigation works (Previous/Next, sidebar)
- ✅ All 10 violations detected
- ✅ Auto-save triggers every 5 seconds
- ✅ Recovery works after refresh
- ✅ Submission works
- ✅ No console errors

---

## Next Steps After Testing

Once testing is complete:
1. Fix any bugs found
2. Deploy backend to Railway
3. Deploy frontend to Vercel
4. Test in production
5. Start using for real exams!
