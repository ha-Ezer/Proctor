# Proctored Exam System - API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://your-backend.up.railway.app/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Token expiration:
- Student tokens: 2 hours
- Admin tokens: 24 hours

---

## Authentication Endpoints

### 1. Student Login
**POST** `/auth/student/login`

Authenticate a student using their email. Returns a JWT token if the email is authorized.

**Request Body:**
```json
{
  "email": "student@example.com",
  "fullName": "John Doe"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "student": {
      "id": "uuid",
      "email": "student@example.com",
      "fullName": "John Doe"
    }
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "You are not authorized to access this exam. Please contact your instructor.",
  "code": "UNAUTHORIZED_EMAIL"
}
```

---

### 2. Admin Login
**POST** `/auth/admin/login`

Authenticate an admin using email and password.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "uuid",
      "email": "admin@example.com",
      "fullName": "Admin Name",
      "role": "super_admin"
    }
  }
}
```

---

### 3. Verify Token
**GET** `/auth/verify`

Verify if the current JWT token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "type": "student"
    }
  }
}
```

---

## Exam Endpoints

### 4. Get Active Exam
**GET** `/exams/active`

Get the currently active exam with all questions.

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Active exam retrieved successfully",
  "data": {
    "exam": {
      "id": "uuid",
      "title": "Final Exam",
      "version": "1.0",
      "durationMinutes": 60,
      "maxViolations": 7,
      "totalQuestions": 50
    },
    "questions": [
      {
        "id": "uuid",
        "questionNumber": 1,
        "questionText": "What is the capital of France?",
        "questionType": "multiple-choice",
        "required": true,
        "imageUrl": null,
        "options": [
          { "index": 0, "text": "London" },
          { "index": 1, "text": "Berlin" },
          { "index": 2, "text": "Paris" },
          { "index": 3, "text": "Madrid" }
        ]
      },
      {
        "id": "uuid",
        "questionNumber": 2,
        "questionText": "Explain photosynthesis in your own words.",
        "questionType": "textarea",
        "required": true,
        "placeholder": "Type your answer here...",
        "imageUrl": null
      }
    ]
  }
}
```

---

## Session Endpoints

### 5. Start Session
**POST** `/sessions/start`

Start a new exam session.

**Headers:**
```
Authorization: Bearer <student_token>
```

**Request Body:**
```json
{
  "examId": "uuid",
  "browserInfo": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "ipAddress": "192.168.1.1"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Exam session started successfully",
  "data": {
    "id": "uuid",
    "sessionId": "session_1234567890_abc123",
    "studentId": "uuid",
    "examId": "uuid",
    "startTime": "2024-01-15T10:00:00.000Z",
    "scheduledEndTime": "2024-01-15T11:00:00.000Z",
    "status": "in_progress",
    "totalViolations": 0
  }
}
```

---

### 6. Check Existing Session
**GET** `/sessions/check/:examId`

Check if the student has an existing session for this exam.

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Existing session found",
  "data": {
    "hasExistingSession": true,
    "session": {
      "id": "uuid",
      "sessionId": "session_1234567890_abc123",
      "status": "in_progress",
      "startTime": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

---

### 7. Get Session
**GET** `/sessions/:sessionId`

Get session details.

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session retrieved successfully",
  "data": {
    "id": "uuid",
    "sessionId": "session_1234567890_abc123",
    "studentId": "uuid",
    "examId": "uuid",
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": null,
    "status": "in_progress",
    "totalViolations": 2,
    "completionPercentage": 45
  }
}
```

---

### 8. Get Recovery Data
**GET** `/sessions/:sessionId/recovery`

Get recovery data for resuming an interrupted session.

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Recovery data retrieved successfully",
  "data": {
    "session": {
      "id": "uuid",
      "sessionId": "session_1234567890_abc123",
      "scheduledEndTime": "2024-01-15T11:00:00.000Z"
    },
    "snapshot": {
      "responses": {
        "q1": { "selectedOption": 2 },
        "q2": { "text": "Photosynthesis is..." }
      },
      "violations": 2,
      "completionPercentage": 45,
      "currentQuestionIndex": 10,
      "timeRemaining": 1800
    },
    "recoveryTimestamp": "2024-01-15T10:30:00.000Z",
    "timeElapsed": 1800000,
    "minimumTimeRemaining": 300000
  }
}
```

---

### 9. Save Snapshot (Auto-save)
**POST** `/sessions/:sessionId/snapshot`

Save progress snapshot for recovery.

**Headers:**
```
Authorization: Bearer <student_token>
```

**Request Body:**
```json
{
  "sessionId": "uuid",
  "responses": {
    "q1": { "selectedOption": 2 },
    "q2": { "text": "Photosynthesis is..." }
  },
  "violations": 2,
  "completionPercentage": 45,
  "currentQuestionIndex": 10,
  "timeRemaining": 1800
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Progress snapshot saved successfully",
  "data": {
    "id": "uuid",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 10. Submit Exam
**POST** `/sessions/:sessionId/submit`

Complete and submit the exam.

**Headers:**
```
Authorization: Bearer <student_token>
```

**Request Body:**
```json
{
  "sessionId": "uuid",
  "submissionType": "manual"
}
```

**Submission Types:**
- `manual` - Student clicked submit
- `auto_time_expired` - Timer ran out
- `auto_violations` - Max violations reached

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Exam submitted successfully",
  "data": {
    "session": {
      "id": "uuid",
      "endTime": "2024-01-15T10:45:00.000Z",
      "status": "completed",
      "score": 85.5,
      "totalViolations": 2
    },
    "report": {
      "id": "uuid",
      "score": 85.5,
      "totalQuestions": 50,
      "correctAnswers": 43,
      "totalViolations": 2,
      "status": "clean"
    }
  }
}
```

---

## Response Endpoints

### 11. Save Response
**POST** `/responses/save`

Save a single answer (used for auto-save).

**Headers:**
```
Authorization: Bearer <student_token>
```

**Request Body:**
```json
{
  "sessionId": "uuid",
  "questionId": "uuid",
  "responseText": "Paris",
  "responseOptionIndex": 2
}
```

**Note:** Either `responseText` (for text/textarea) or `responseOptionIndex` (for multiple-choice) should be provided.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Response saved successfully",
  "data": {
    "id": "uuid",
    "sessionId": "uuid",
    "questionId": "uuid",
    "responseOptionIndex": 2,
    "isCorrect": true,
    "answeredAt": "2024-01-15T10:05:00.000Z"
  }
}
```

---

### 12. Bulk Save Responses
**POST** `/responses/bulk`

Save multiple responses at once (useful for final submission).

**Headers:**
```
Authorization: Bearer <student_token>
```

**Request Body:**
```json
{
  "sessionId": "uuid",
  "responses": [
    {
      "questionId": "uuid1",
      "responseOptionIndex": 2
    },
    {
      "questionId": "uuid2",
      "responseText": "Photosynthesis is..."
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "3 responses saved successfully",
  "data": {
    "savedCount": 3
  }
}
```

---

### 13. Get Session Responses
**GET** `/responses/session/:sessionId`

Get all responses for a session.

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session responses retrieved successfully",
  "data": {
    "responses": [
      {
        "id": "uuid",
        "questionId": "uuid",
        "responseOptionIndex": 2,
        "responseText": null,
        "isCorrect": true,
        "answeredAt": "2024-01-15T10:05:00.000Z"
      }
    ],
    "count": 25
  }
}
```

---

## Violation Endpoints

### 14. Log Violation
**POST** `/violations/log`

Log a proctoring violation.

**Headers:**
```
Authorization: Bearer <student_token>
```

**Request Body:**
```json
{
  "sessionId": "uuid",
  "violationType": "tab_switch",
  "description": "User switched to another tab",
  "severity": "medium",
  "browserInfo": "Mozilla/5.0...",
  "deviceInfo": "Windows 10",
  "additionalData": {
    "timestamp": 1705315200000,
    "url": "https://google.com"
  }
}
```

**Violation Types:**
- `exam_started` - Session started (logged automatically)
- `tab_switch` - User switched tabs
- `window_blur` - Window lost focus
- `right_click` - Right-click attempted
- `developer_tools` - F12 or dev tools opened
- `paste_detected` - Text pasted
- `copy_detected` - Text copied
- `keyboard_shortcut` - Suspicious shortcut used

**Severity Levels:** `low`, `medium`, `high`, `critical`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Violation logged successfully",
  "data": {
    "totalViolations": 3,
    "shouldTerminate": false
  }
}
```

---

### 15. Get Session Violations
**GET** `/violations/session/:sessionId`

Get all violations for a session.

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session violations retrieved successfully",
  "data": {
    "violations": [
      {
        "id": "uuid",
        "violationType": "tab_switch",
        "severity": "medium",
        "description": "User switched to another tab",
        "detectedAt": "2024-01-15T10:10:00.000Z",
        "browserInfo": "Mozilla/5.0..."
      }
    ],
    "count": 3
  }
}
```

---

### 16. Get Violation Statistics
**GET** `/violations/stats/:sessionId`

Get violation statistics for a session.

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Violation statistics retrieved successfully",
  "data": {
    "total": 5,
    "bySeverity": {
      "low": 1,
      "medium": 3,
      "high": 1,
      "critical": 0
    },
    "byType": {
      "tab_switch": 2,
      "paste_detected": 2,
      "window_blur": 1
    }
  }
}
```

---

## Admin Endpoints

All admin endpoints require admin authentication.

### 17. Get Dashboard Stats
**GET** `/admin/dashboard/stats`

Get dashboard statistics.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "totalSessions": 150,
    "activeSessions": 5,
    "completedToday": 12,
    "averageCompletionRate": "87.50",
    "averageViolations": "2.30",
    "flaggedSessions": 8,
    "recentSessions": [
      {
        "sessionId": "session_1234567890_abc123",
        "startTime": "2024-01-15T10:00:00.000Z",
        "status": "in_progress",
        "studentName": "John Doe",
        "examTitle": "Final Exam"
      }
    ],
    "violationTrends": [
      { "violationType": "tab_switch", "count": 45 },
      { "violationType": "paste_detected", "count": 32 }
    ]
  }
}
```

---

### 18. Get Sessions (Filtered)
**GET** `/admin/sessions?status=completed&page=1&limit=50`

Get all sessions with filtering, sorting, and pagination.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `status` - Filter by status: `in_progress`, `completed`, `terminated`, `expired`, `all` (default: `all`)
- `examId` - Filter by exam ID (UUID)
- `studentEmail` - Filter by student email
- `startDate` - Filter by start date (ISO format)
- `endDate` - Filter by end date (ISO format)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50, max: 1000)
- `sortBy` - Sort field: `start_time`, `status`, `violations`, `score` (default: `start_time`)
- `sortOrder` - Sort order: `asc`, `desc` (default: `desc`)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Sessions retrieved successfully",
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "sessionId": "session_1234567890_abc123",
        "startTime": "2024-01-15T10:00:00.000Z",
        "endTime": "2024-01-15T10:45:00.000Z",
        "status": "completed",
        "completionPercentage": 100,
        "totalViolations": 2,
        "score": 85.5,
        "submissionType": "manual",
        "studentEmail": "student@example.com",
        "studentName": "John Doe",
        "examTitle": "Final Exam",
        "examVersion": "1.0"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 50,
      "totalPages": 3
    }
  }
}
```

---

### 19. Get Session Details
**GET** `/admin/sessions/:sessionId/details`

Get detailed session information including questions and responses (side-by-side view).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session details retrieved successfully",
  "data": {
    "session": {
      "id": "uuid",
      "sessionId": "session_1234567890_abc123",
      "studentEmail": "student@example.com",
      "studentName": "John Doe",
      "examTitle": "Final Exam",
      "examVersion": "1.0",
      "durationMinutes": 60,
      "startTime": "2024-01-15T10:00:00.000Z",
      "endTime": "2024-01-15T10:45:00.000Z",
      "status": "completed",
      "score": 85.5,
      "totalViolations": 2
    },
    "responses": [
      {
        "questionNumber": 1,
        "questionText": "What is the capital of France?",
        "questionType": "multiple-choice",
        "options": ["London", "Berlin", "Paris", "Madrid"],
        "selectedOptionIndex": 2,
        "selectedOption": "Paris",
        "correctAnswer": "Paris",
        "isCorrect": true,
        "answeredAt": "2024-01-15T10:05:00.000Z"
      },
      {
        "questionNumber": 2,
        "questionText": "Explain photosynthesis.",
        "questionType": "textarea",
        "responseText": "Photosynthesis is the process...",
        "answeredAt": "2024-01-15T10:10:00.000Z"
      }
    ],
    "violations": [
      {
        "violationType": "tab_switch",
        "severity": "medium",
        "description": "User switched to another tab",
        "detectedAt": "2024-01-15T10:15:00.000Z",
        "browserInfo": "Mozilla/5.0..."
      }
    ]
  }
}
```

---

### 20. Export Sessions
**GET** `/admin/sessions/export?status=completed`

Export session data as CSV.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:** Same as "Get Sessions" endpoint

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session data exported successfully",
  "data": [
    {
      "sessionId": "session_1234567890_abc123",
      "studentName": "John Doe",
      "studentEmail": "student@example.com",
      "examTitle": "Final Exam",
      "startTime": "2024-01-15T10:00:00.000Z",
      "endTime": "2024-01-15T10:45:00.000Z",
      "status": "completed",
      "completionPercentage": 100,
      "totalViolations": 2,
      "score": 85.5,
      "submissionType": "manual"
    }
  ]
}
```

---

### 21. Get Authorized Students
**GET** `/admin/students`

Get all authorized students.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Authorized students retrieved successfully",
  "data": {
    "students": [
      {
        "id": "uuid",
        "email": "student@example.com",
        "fullName": "John Doe",
        "lastLogin": "2024-01-15T10:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 25
  }
}
```

---

### 22. Add Authorized Student
**POST** `/admin/students/add`

Add a new authorized student.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "email": "newstudent@example.com",
  "fullName": "Jane Smith"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Student authorized successfully",
  "data": {
    "id": "uuid",
    "email": "newstudent@example.com",
    "fullName": "Jane Smith",
    "isAuthorized": true,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 23. Remove Authorized Student
**POST** `/admin/students/remove`

Revoke student authorization.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "email": "student@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student authorization revoked successfully",
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "isAuthorized": false,
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 24. Bulk Add Students
**POST** `/admin/students/bulk`

Add multiple students at once (CSV import).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "students": [
    {
      "email": "student1@example.com",
      "fullName": "Student One"
    },
    {
      "email": "student2@example.com",
      "fullName": "Student Two"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "2 students authorized successfully",
  "data": {
    "students": [
      {
        "id": "uuid",
        "email": "student1@example.com",
        "fullName": "Student One"
      },
      {
        "id": "uuid",
        "email": "student2@example.com",
        "fullName": "Student Two"
      }
    ],
    "count": 2
  }
}
```

---

### 25. Get All Exams
**GET** `/admin/exams`

Get all exams with question counts.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Exams retrieved successfully",
  "data": {
    "exams": [
      {
        "id": "uuid",
        "title": "Final Exam",
        "description": "End of semester exam",
        "version": "1.0",
        "durationMinutes": 60,
        "maxViolations": 7,
        "isActive": true,
        "questionCount": 50,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 3
  }
}
```

---

### 26. Create Exam
**POST** `/admin/exams/create`

Create a new exam.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "title": "Midterm Exam",
  "description": "Mid-semester assessment",
  "version": "2.0",
  "durationMinutes": 90,
  "maxViolations": 5
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Exam created successfully",
  "data": {
    "id": "uuid",
    "title": "Midterm Exam",
    "version": "2.0",
    "durationMinutes": 90,
    "maxViolations": 5,
    "isActive": false,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 27. Add Question
**POST** `/admin/questions/add`

Add a question to an exam.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body (Multiple-Choice):**
```json
{
  "examId": "uuid",
  "questionNumber": 1,
  "questionText": "What is 2 + 2?",
  "questionType": "multiple-choice",
  "required": true,
  "imageUrl": "",
  "options": ["2", "3", "4", "5"],
  "correctAnswer": 2
}
```

**Request Body (Text/Textarea):**
```json
{
  "examId": "uuid",
  "questionNumber": 2,
  "questionText": "Explain your reasoning.",
  "questionType": "textarea",
  "required": true,
  "placeholder": "Type your answer here..."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Question added successfully",
  "data": {
    "questionId": "uuid",
    "success": true
  }
}
```

---

### 28. Activate/Deactivate Exam
**POST** `/admin/exams/:examId/activate`

Set exam as active or inactive. Only one exam can be active at a time.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Exam activated successfully",
  "data": {
    "id": "uuid",
    "title": "Final Exam",
    "isActive": true,
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED_EMAIL` | 403 | Student email not authorized |
| `INVALID_CREDENTIALS` | 401 | Invalid login credentials |
| `TOKEN_MISSING` | 401 | Authorization token not provided |
| `TOKEN_EXPIRED` | 401 | Token has expired |
| `TOKEN_INVALID` | 403 | Token is invalid |
| `AUTH_REQUIRED` | 401 | Authentication required |
| `STUDENT_REQUIRED` | 403 | Student access required |
| `ADMIN_REQUIRED` | 403 | Admin access required |
| `NO_ACTIVE_EXAM` | 404 | No active exam found |
| `SESSION_NOT_FOUND` | 404 | Session not found |
| `EXAM_NOT_FOUND` | 404 | Exam not found |
| `STUDENT_NOT_FOUND` | 404 | Student not found |
| `NO_RECOVERY_DATA` | 404 | No recovery data available |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AUTH_RATE_LIMIT_EXCEEDED` | 429 | Too many login attempts |
| `VIOLATION_RATE_LIMIT_EXCEEDED` | 429 | Too many violation logs |
| `RESPONSE_RATE_LIMIT_EXCEEDED` | 429 | Too many response saves |

---

## Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 requests | 1 minute |
| Authentication | 5 attempts | 15 minutes |
| Violation Logging | 20 requests | 1 minute |
| Response Saving | 30 requests | 1 minute |

---

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. All IDs are UUIDs (v4)
3. Passwords are hashed using bcrypt (cost: 12)
4. Student authentication is email-based only (no password)
5. Admin authentication requires both email and password
6. Sessions automatically terminate when max violations reached
7. Auto-save should trigger every 5 seconds on the frontend
8. Progress recovery guarantees minimum 5 minutes remaining time
