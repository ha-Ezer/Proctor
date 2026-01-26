#!/bin/bash

# Automated Frontend Flow Testing Script
# Tests the complete user journey from login to exam access

set -e  # Exit on error

FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"
TEST_EMAIL="student1@test.com"
TEST_NAME="Test Student 1"

echo "========================================="
echo "Frontend Flow Automated Test"
echo "========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check servers are running
echo -e "${YELLOW}Test 1: Checking servers status...${NC}"
if curl -s "$FRONTEND_URL" > /dev/null; then
    echo -e "${GREEN}✓ Frontend is running on $FRONTEND_URL${NC}"
else
    echo -e "${RED}✗ Frontend is NOT running${NC}"
    exit 1
fi

if curl -s "$BACKEND_URL/health" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend is running and healthy${NC}"
else
    echo -e "${RED}✗ Backend is NOT healthy${NC}"
    exit 1
fi

echo ""

# Test 2: Student login
echo -e "${YELLOW}Test 2: Testing student login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/student/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"fullName\":\"$TEST_NAME\"}")

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
    STUDENT_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.student.id')
    echo "  Token: ${TOKEN:0:20}..."
    echo "  Student ID: $STUDENT_ID"
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$LOGIN_RESPONSE" | jq '.'
    exit 1
fi

echo ""

# Test 3: Get active exam with token
echo -e "${YELLOW}Test 3: Testing exam retrieval with authentication...${NC}"
EXAM_RESPONSE=$(curl -s "$BACKEND_URL/api/exams/active" \
  -H "Authorization: Bearer $TOKEN")

if echo "$EXAM_RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ Exam retrieval successful${NC}"
    EXAM_ID=$(echo "$EXAM_RESPONSE" | jq -r '.data.exam.id')
    EXAM_TITLE=$(echo "$EXAM_RESPONSE" | jq -r '.data.exam.title')
    QUESTION_COUNT=$(echo "$EXAM_RESPONSE" | jq '.data.questions | length')
    echo "  Exam ID: $EXAM_ID"
    echo "  Title: $EXAM_TITLE"
    echo "  Questions: $QUESTION_COUNT"
else
    echo -e "${RED}✗ Exam retrieval failed${NC}"
    echo "$EXAM_RESPONSE" | jq '.'
    exit 1
fi

echo ""

# Test 4: Check for existing session
echo -e "${YELLOW}Test 4: Checking for existing session...${NC}"
SESSION_CHECK=$(curl -s "$BACKEND_URL/api/sessions/check/$EXAM_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$SESSION_CHECK" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ Session check successful${NC}"
    HAS_EXISTING=$(echo "$SESSION_CHECK" | jq -r '.data.hasExistingSession')
    echo "  Has existing session: $HAS_EXISTING"
else
    echo -e "${RED}✗ Session check failed${NC}"
    echo "$SESSION_CHECK" | jq '.'
    exit 1
fi

echo ""

# Test 5: Create new session if needed
if [ "$HAS_EXISTING" = "false" ]; then
    echo -e "${YELLOW}Test 5: Creating new exam session...${NC}"
    SESSION_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/sessions/start" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"examId\":\"$EXAM_ID\",\"browserInfo\":\"Test Browser\"}")

    if echo "$SESSION_RESPONSE" | grep -q "success.*true"; then
        echo -e "${GREEN}✓ Session created successfully${NC}"
        SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.data.id')
        SESSION_CODE=$(echo "$SESSION_RESPONSE" | jq -r '.data.sessionCode')
        echo "  Session ID: $SESSION_ID"
        echo "  Session Code: $SESSION_CODE"
    else
        echo -e "${RED}✗ Session creation failed${NC}"
        echo "$SESSION_RESPONSE" | jq '.'
        exit 1
    fi
else
    echo -e "${YELLOW}Test 5: Using existing session${NC}"
    SESSION_ID=$(echo "$SESSION_CHECK" | jq -r '.data.session.id')
    echo "  Session ID: $SESSION_ID"
fi

echo ""

# Test 6: Verify session is accessible
echo -e "${YELLOW}Test 6: Verifying session access...${NC}"
SESSION_GET=$(curl -s "$BACKEND_URL/api/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$SESSION_GET" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ Session accessible${NC}"
    SESSION_STATUS=$(echo "$SESSION_GET" | jq -r '.data.status')
    echo "  Status: $SESSION_STATUS"
else
    echo -e "${RED}✗ Session not accessible${NC}"
    echo "$SESSION_GET" | jq '.'
    exit 1
fi

echo ""

# Summary
echo "========================================="
echo -e "${GREEN}All Tests Passed! ✓${NC}"
echo "========================================="
echo ""
echo "Next Steps for Manual Testing:"
echo "1. Open $FRONTEND_URL in your browser"
echo "2. Clear browser localStorage (DevTools → Application → Clear All)"
echo "3. Login with:"
echo "   Email: $TEST_EMAIL"
echo "   Name: $TEST_NAME"
echo "4. You should be redirected to /exam page"
echo "5. Verify exam loads without 401 errors"
echo "6. Check browser console for any errors"
echo ""
echo "Session Info for Testing:"
echo "  Session ID: $SESSION_ID"
echo "  Exam ID: $EXAM_ID"
echo "  Student ID: $STUDENT_ID"
echo ""
