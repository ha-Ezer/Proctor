# Frontend Testing Checklist

## Setup

- [ ] Install dependencies: `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Configure `VITE_API_URL` to point to backend (http://localhost:3000/api)
- [ ] Ensure backend is running on port 3000
- [ ] Start frontend: `npm run dev`

## Authentication Tests

### Login Page
- [ ] Navigate to http://localhost:5173
- [ ] Should redirect to /login
- [ ] Form validation works:
  - [ ] Email validation (valid email required)
  - [ ] Full name validation (min 2 characters)
- [ ] Try login with unauthorized email - should show error
- [ ] Try login with authorized email - should navigate to exam
- [ ] Token stored in localStorage after successful login
- [ ] Student data stored in localStorage

## Exam Interface Tests

### Initial Load
- [ ] After login, redirected to /exam
- [ ] Exam loads with all questions
- [ ] Header displays:
  - [ ] Exam title
  - [ ] Student name
  - [ ] Timer (countdown)
  - [ ] Progress bar (0%)
  - [ ] Violation counter (0/7)
- [ ] First question displayed
- [ ] Question navigation sidebar shows all questions
- [ ] All questions marked as unanswered (gray)

### Question Types

#### Multiple Choice
- [ ] Radio buttons render correctly
- [ ] Can select an option
- [ ] Selection highlights the option
- [ ] Only one option can be selected at a time

#### Text Input
- [ ] Text input field renders
- [ ] Can type text
- [ ] Placeholder text shows

#### Textarea
- [ ] Textarea renders
- [ ] Can type multi-line text
- [ ] Placeholder text shows
- [ ] Scrollbar appears for long text

### Question Navigation

#### Previous/Next Buttons
- [ ] "Previous" button disabled on first question
- [ ] "Next" button works to go to next question
- [ ] "Previous" button works to go back
- [ ] Last question shows "Submit Exam" button instead of "Next"

#### Question Sidebar
- [ ] Click on question number jumps to that question
- [ ] Current question highlighted in blue
- [ ] Answered questions show checkmark and blue border
- [ ] Unanswered questions show circle and gray border
- [ ] Summary stats show correct counts (Answered/Remaining)

### Progress & Timer

#### Progress Bar
- [ ] Progress updates as questions are answered
- [ ] Shows percentage (e.g., 10%, 20%, etc.)
- [ ] Visual bar fills proportionally

#### Timer
- [ ] Counts down correctly (second by second)
- [ ] Shows HH:MM:SS format if > 1 hour
- [ ] Shows MM:SS format if < 1 hour
- [ ] Timer turns yellow when < 5 minutes (warning)
- [ ] Timer turns red when < 1 minute (danger)
- [ ] Timer pulses when in danger state

### Auto-Save

- [ ] Wait 5 seconds after answering - auto-save should trigger
- [ ] Check browser console for auto-save logs
- [ ] Open browser DevTools → Network → should see POST to /sessions/:id/snapshot
- [ ] Answer changes trigger debounced save (2 seconds)
- [ ] Switch to another app and back - should trigger immediate save

### Proctoring - Violation Detection

**CRITICAL: Test all 10 violation types**

#### 1. Tab Switch
- [ ] Switch to another browser tab
- [ ] Violation alert appears in top-right
- [ ] Violation counter increments (1/7)
- [ ] Alert auto-dismisses after 5 seconds

#### 2. Window Blur
- [ ] Click outside browser window (on desktop/another app)
- [ ] Violation logged
- [ ] Counter increments

#### 3. Right-Click
- [ ] Try to right-click on the page
- [ ] Context menu should NOT appear
- [ ] Violation alert shows
- [ ] Counter increments

#### 4. Developer Tools (F12)
- [ ] Press F12
- [ ] Dev tools should NOT open
- [ ] Violation logged
- [ ] Counter increments

#### 5. Developer Tools (Ctrl+Shift+I)
- [ ] Press Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)
- [ ] Dev tools blocked
- [ ] Violation logged
- [ ] Counter increments

#### 6. Developer Tools (Ctrl+Shift+J)
- [ ] Press Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac)
- [ ] Console blocked
- [ ] Violation logged
- [ ] Counter increments

#### 7. Developer Tools (Ctrl+Shift+C)
- [ ] Press Ctrl+Shift+C (Windows/Linux) or Cmd+Option+C (Mac)
- [ ] Inspector blocked
- [ ] Violation logged
- [ ] Counter increments

#### 8. View Source (Ctrl+U)
- [ ] Press Ctrl+U (Windows/Linux) or Cmd+U (Mac)
- [ ] View source blocked
- [ ] Violation logged
- [ ] Counter increments

#### 9. Paste Detection
- [ ] Copy some text
- [ ] Try to paste into a text field
- [ ] Paste is allowed BUT logged
- [ ] Violation shows with character count
- [ ] Counter increments

#### 10. Copy Detection
- [ ] Select text on the page
- [ ] Copy it (Ctrl+C)
- [ ] Copy is allowed BUT logged
- [ ] Violation shows with character count
- [ ] Counter increments

### Violation Behavior

#### Alert Appearance
- [ ] Violation alert appears in top-right corner
- [ ] Shows violation type message
- [ ] Shows current count / max count
- [ ] Auto-dismisses after 5 seconds
- [ ] Can manually close with X button

#### Alert Colors
- [ ] Normal violations: Blue background
- [ ] Close to limit (5-6/7): Yellow/warning background
- [ ] At limit (7/7): Red/danger background, shakes
- [ ] Counter in header changes color based on count

#### Max Violations Termination
- [ ] Trigger 7 violations
- [ ] Exam should auto-terminate
- [ ] Should auto-submit
- [ ] Redirects to /complete?reason=violations
- [ ] Shows termination message

### Session Recovery

#### Create Recovery Scenario
- [ ] Start exam
- [ ] Answer 5 questions
- [ ] Trigger 2 violations
- [ ] Refresh the page (F5)

#### Recovery Dialog
- [ ] Recovery dialog appears on page load
- [ ] Shows:
  - [ ] Number of answered questions (5)
  - [ ] Violation count (2)
  - [ ] Time elapsed
  - [ ] Guaranteed minimum time (5 minutes)
- [ ] "Resume Exam" button
- [ ] "Start Fresh" button

#### Accept Recovery
- [ ] Click "Resume Exam"
- [ ] All 5 answered questions restored correctly
- [ ] Violation count restored (2)
- [ ] Current question index restored
- [ ] Timer shows remaining time (minimum 5 minutes)
- [ ] Can continue answering questions

#### Decline Recovery
- [ ] Refresh page again
- [ ] Click "Start Fresh"
- [ ] All responses cleared
- [ ] Violations reset to 0
- [ ] Timer starts from full duration
- [ ] Current question is #1

### Submission

#### Submit Dialog
- [ ] Answer 40 out of 50 questions
- [ ] Click "Submit Exam" on last question OR
- [ ] Navigate to last question and click "Submit Exam"
- [ ] Submit dialog appears showing:
  - [ ] Answered count: 40
  - [ ] Unanswered count: 10
  - [ ] Warning message about unanswered questions
  - [ ] "Yes, Submit Exam" button
  - [ ] "Cancel" button

#### Confirm Submission
- [ ] Click "Yes, Submit Exam"
- [ ] Button shows loading spinner
- [ ] Redirects to /complete
- [ ] Shows success message

#### Cancel Submission
- [ ] Open submit dialog
- [ ] Click "Cancel"
- [ ] Dialog closes
- [ ] Returns to exam (can continue answering)

### Time Expiration

- [ ] Wait for timer to reach 0:00 (or manually adjust timer in DevTools)
- [ ] Exam auto-submits when time expires
- [ ] Redirects to /complete
- [ ] Shows completion message

### Complete Page

#### Normal Completion
- [ ] After manual submit, shows success page
- [ ] Green checkmark icon
- [ ] "Exam Submitted Successfully" message
- [ ] Shows submission time and date
- [ ] Shows status: "Completed"
- [ ] "What Happens Next" information
- [ ] "Return to Login" button works

#### Violation Termination
- [ ] After max violations, redirected to /complete?reason=violations
- [ ] Red warning icon with shake animation
- [ ] "Exam Terminated" message
- [ ] Explanation about violations
- [ ] List of common violations
- [ ] "Return to Login" button works

#### Logout
- [ ] Click "Return to Login"
- [ ] Clears localStorage (token, student data)
- [ ] Redirects to /login
- [ ] Cannot go back to exam without logging in again

## Edge Cases & Error Handling

### Network Errors
- [ ] Disconnect internet during exam
- [ ] Try to answer a question
- [ ] Auto-save should fail gracefully
- [ ] Still saved to sessionStorage as backup
- [ ] Reconnect internet - next save should work

### API Errors
- [ ] Stop backend server
- [ ] Try to log in - should show error message
- [ ] Try to load exam - should show error message
- [ ] Start backend again - should work normally

### Token Expiration
- [ ] Login successfully
- [ ] Wait for token to expire (2 hours) OR manually delete token
- [ ] Try to navigate or make API call
- [ ] Should redirect to login automatically

### Browser Back Button
- [ ] During exam, click browser back button
- [ ] Should stay on exam page (browser history blocked)
- [ ] Should not navigate away

### Page Refresh
- [ ] Refresh during exam multiple times
- [ ] Each time recovery dialog should appear
- [ ] Progress should be maintained

## Responsive Design

### Desktop (1920x1080)
- [ ] Layout looks good
- [ ] Sidebar visible on right
- [ ] All elements properly sized

### Tablet (768x1024)
- [ ] Layout adapts
- [ ] Question navigation still accessible
- [ ] Touch interactions work

### Mobile (375x667)
- [ ] Layout stacks vertically
- [ ] Question navigation accessible
- [ ] All interactions work with touch
- [ ] Text readable without zoom

## Accessibility

### Keyboard Navigation
- [ ] Can tab through form fields
- [ ] Can select radio buttons with keyboard
- [ ] Enter key submits forms
- [ ] Escape key closes dialogs (if implemented)

### Screen Readers
- [ ] Form labels properly associated
- [ ] ARIA labels present on buttons
- [ ] Status messages announced
- [ ] Progress announced

## Performance

### Load Time
- [ ] Initial page load < 2 seconds
- [ ] Exam loads < 3 seconds
- [ ] No jank or freezing
- [ ] Smooth animations

### Memory
- [ ] Open DevTools → Performance
- [ ] Monitor memory during exam
- [ ] No memory leaks
- [ ] CPU usage reasonable

## Security

### XSS Protection
- [ ] Try entering `<script>alert('XSS')</script>` in text fields
- [ ] Should render as plain text, not execute
- [ ] No security warnings in console

### Token Security
- [ ] Token stored in localStorage (inspect in DevTools)
- [ ] Token sent in Authorization header
- [ ] API calls fail without valid token

### Proctoring Bypass Attempts
- [ ] Try opening DevTools from OS menu (should be detected)
- [ ] Try view source from browser menu (should be blocked)
- [ ] Try screenshot tools (allowed - can't prevent)
- [ ] All logged violations appear in violation counter

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (Mac only)

Each browser should:
- [ ] Load exam correctly
- [ ] All violations detected
- [ ] Auto-save works
- [ ] Timer works
- [ ] Submission works

## Final Integration Test

**Complete End-to-End Flow:**

1. [ ] Clear all localStorage/sessionStorage
2. [ ] Navigate to app
3. [ ] Login with authorized email
4. [ ] Exam loads successfully
5. [ ] Answer first 10 questions (mix of types)
6. [ ] Trigger 2 violations
7. [ ] Wait for auto-save
8. [ ] Refresh page
9. [ ] Accept recovery
10. [ ] Verify all answers restored
11. [ ] Continue answering questions (10 more)
12. [ ] Check progress bar (20/50 = 40%)
13. [ ] Navigate using sidebar
14. [ ] Trigger 2 more violations (total 4)
15. [ ] Answer remaining questions
16. [ ] Submit exam
17. [ ] Verify completion page
18. [ ] Logout
19. [ ] Verify cannot access exam without login

**Success Criteria:**
- No errors in console
- All data saved correctly
- All violations logged
- Smooth user experience
- Proper navigation flow

## Automated Testing (Optional)

If time permits, create:
- [ ] Unit tests for hooks (useProctoring, useAutoSave, useTimer)
- [ ] Integration tests for login flow
- [ ] E2E tests with Playwright/Cypress

## Documentation

- [ ] README.md is up to date
- [ ] All environment variables documented
- [ ] Setup instructions are clear
- [ ] Troubleshooting section added

---

**Test Status**: ⏳ Pending

**Tested By**: _______________

**Date**: _______________

**Notes**:
