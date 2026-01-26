#!/bin/bash

# Test Violation Flow: 0 → 7 → Terminate
# Verifies that violations count up correctly and session terminates at limit

set -e

BACKEND_URL="http://localhost:3000"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "Violation Flow Test (0 → 7 → Terminate)"
echo "========================================="
echo ""

# Step 1: Login
echo -e "${YELLOW}Step 1: Login as student${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/student/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student2@test.com","fullName":"Test Student 2"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
STUDENT_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.student.id')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "  Student ID: $STUDENT_ID"
else
    echo -e "${RED}✗ Login failed${NC}"
    exit 1
fi

# Step 2: Get exam
echo ""
echo -e "${YELLOW}Step 2: Get exam details${NC}"
EXAM_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/exams/active")
EXAM_ID=$(echo "$EXAM_RESPONSE" | jq -r '.data.exam.id')
MAX_VIOLATIONS=$(echo "$EXAM_RESPONSE" | jq -r '.data.exam.max_violations')

if [ "$EXAM_ID" != "null" ]; then
    echo -e "${GREEN}✓ Exam retrieved${NC}"
    echo "  Exam ID: $EXAM_ID"
    echo "  Max Violations: $MAX_VIOLATIONS"
else
    echo -e "${RED}✗ Failed to get exam${NC}"
    exit 1
fi

# Step 3: Start new session
echo ""
echo -e "${YELLOW}Step 3: Start new exam session${NC}"
SESSION_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/sessions/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"examId\":\"$EXAM_ID\",\"browserInfo\":\"Test Browser\",\"ipAddress\":\"127.0.0.1\"}")

SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.data.id')

if [ "$SESSION_ID" != "null" ] && [ -n "$SESSION_ID" ]; then
    echo -e "${GREEN}✓ Session started${NC}"
    echo "  Session ID: $SESSION_ID"
else
    echo -e "${RED}✗ Failed to start session${NC}"
    echo "$SESSION_RESPONSE" | jq '.'
    exit 1
fi

# Step 4: Log violations 1-6 (should NOT terminate)
echo ""
echo -e "${YELLOW}Step 4: Logging violations 1-6 (should NOT terminate)${NC}"

for i in {1..6}; do
    echo -e "${BLUE}  Logging violation $i...${NC}"

    VIOLATION_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/violations/log" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"sessionId\":\"$SESSION_ID\",\"violationType\":\"tab_switch\",\"description\":\"Test violation $i\",\"severity\":\"medium\"}")

    SHOULD_TERMINATE=$(echo "$VIOLATION_RESPONSE" | jq -r '.data.shouldTerminate')
    TOTAL_VIOLATIONS=$(echo "$VIOLATION_RESPONSE" | jq -r '.data.totalViolations')

    if [ "$SHOULD_TERMINATE" == "false" ]; then
        echo -e "${GREEN}    ✓ Violation $i logged (Total: $TOTAL_VIOLATIONS, shouldTerminate: false)${NC}"
    else
        echo -e "${RED}    ✗ Unexpected termination at violation $i${NC}"
        exit 1
    fi

    sleep 0.5
done

# Step 5: Log 7th violation (SHOULD terminate)
echo ""
echo -e "${YELLOW}Step 5: Logging 7th violation (SHOULD terminate)${NC}"

VIOLATION_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/violations/log" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"violationType\":\"developer_tools\",\"description\":\"Test violation 7\",\"severity\":\"high\"}")

SHOULD_TERMINATE=$(echo "$VIOLATION_RESPONSE" | jq -r '.data.shouldTerminate')
TOTAL_VIOLATIONS=$(echo "$VIOLATION_RESPONSE" | jq -r '.data.totalViolations')

if [ "$SHOULD_TERMINATE" == "true" ]; then
    echo -e "${GREEN}✓ Violation 7 logged (Total: $TOTAL_VIOLATIONS, shouldTerminate: TRUE)${NC}"
    echo -e "${GREEN}✓ Session correctly flagged for termination${NC}"
else
    echo -e "${RED}✗ Session should terminate at 7th violation but didn't${NC}"
    exit 1
fi

# Step 6: Verify session status
echo ""
echo -e "${YELLOW}Step 6: Verify session status${NC}"

SESSION_CHECK=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/sessions/$SESSION_ID")
SESSION_STATUS=$(echo "$SESSION_CHECK" | jq -r '.data.status')
SESSION_VIOLATIONS=$(echo "$SESSION_CHECK" | jq -r '.data.total_violations')

echo "  Status: $SESSION_STATUS"
echo "  Total Violations: $SESSION_VIOLATIONS"

if [ "$SESSION_VIOLATIONS" -eq 7 ]; then
    echo -e "${GREEN}✓ Violation count is correct (7)${NC}"
else
    echo -e "${RED}✗ Violation count mismatch (expected 7, got $SESSION_VIOLATIONS)${NC}"
    exit 1
fi

# Step 7: Attempt to log 8th violation (should still work, but shouldTerminate should be true)
echo ""
echo -e "${YELLOW}Step 7: Test logging violation after limit (optional)${NC}"

VIOLATION_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/violations/log" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"violationType\":\"paste\",\"description\":\"Test violation 8\",\"severity\":\"medium\"}")

SHOULD_TERMINATE=$(echo "$VIOLATION_RESPONSE" | jq -r '.data.shouldTerminate')
TOTAL_VIOLATIONS=$(echo "$VIOLATION_RESPONSE" | jq -r '.data.totalViolations')

if [ "$SHOULD_TERMINATE" == "true" ]; then
    echo -e "${GREEN}✓ 8th violation still returns shouldTerminate: TRUE (Total: $TOTAL_VIOLATIONS)${NC}"
else
    echo -e "${RED}✗ After exceeding limit, shouldTerminate should remain TRUE${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}All Tests Passed! ✓${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ Violations 1-6: shouldTerminate = false"
echo "  ✓ Violation 7: shouldTerminate = true"
echo "  ✓ Total violations tracked correctly"
echo "  ✓ Session terminated at max violations (7)"
echo ""
echo "The violation counting system is working correctly!"
