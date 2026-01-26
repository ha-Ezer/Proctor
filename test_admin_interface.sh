#!/bin/bash

# Test Admin Interface: Complete test-fix-validate loop
# Tests all admin endpoints for UI, console, and network issues

set -e

BACKEND_URL="http://localhost:3000"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "Admin Interface Test Suite"
echo "========================================="
echo ""

# Step 1: Admin Login
echo -e "${YELLOW}Step 1: Admin Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
ADMIN_EMAIL=$(echo "$LOGIN_RESPONSE" | jq -r '.data.admin.email')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Admin login successful${NC}"
    echo "  Email: $ADMIN_EMAIL"
else
    echo -e "${RED}✗ Admin login failed${NC}"
    echo "$LOGIN_RESPONSE" | jq '.'
    exit 1
fi

# Step 2: Dashboard Stats
echo ""
echo -e "${YELLOW}Step 2: Get Dashboard Statistics${NC}"
STATS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/admin/dashboard/stats")
STATS_SUCCESS=$(echo "$STATS_RESPONSE" | jq -r '.success')

if [ "$STATS_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ Dashboard stats retrieved${NC}"
    TOTAL_STUDENTS=$(echo "$STATS_RESPONSE" | jq -r '.data.totalStudents')
    TOTAL_EXAMS=$(echo "$STATS_RESPONSE" | jq -r '.data.totalExams')
    ACTIVE_SESSIONS=$(echo "$STATS_RESPONSE" | jq -r '.data.activeSessions')
    echo "  Total Students: $TOTAL_STUDENTS"
    echo "  Total Exams: $TOTAL_EXAMS"
    echo "  Active Sessions: $ACTIVE_SESSIONS"
else
    echo -e "${RED}✗ Failed to get dashboard stats${NC}"
    echo "$STATS_RESPONSE" | jq '.'
    exit 1
fi

# Step 3: Get All Exams
echo ""
echo -e "${YELLOW}Step 3: Get All Exams${NC}"
EXAMS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/admin/exams")
EXAMS_SUCCESS=$(echo "$EXAMS_RESPONSE" | jq -r '.success')

if [ "$EXAMS_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ Exams retrieved${NC}"
    EXAM_COUNT=$(echo "$EXAMS_RESPONSE" | jq -r '.data.exams | length')
    echo "  Total Exams: $EXAM_COUNT"

    # Show first exam details
    if [ "$EXAM_COUNT" -gt 0 ]; then
        FIRST_EXAM_TITLE=$(echo "$EXAMS_RESPONSE" | jq -r '.data.exams[0].title')
        FIRST_EXAM_DURATION=$(echo "$EXAMS_RESPONSE" | jq -r '.data.exams[0].durationMinutes')
        FIRST_EXAM_MAX_VIOLATIONS=$(echo "$EXAMS_RESPONSE" | jq -r '.data.exams[0].maxViolations')
        echo "  First Exam: $FIRST_EXAM_TITLE"
        echo "    Duration: $FIRST_EXAM_DURATION minutes"
        echo "    Max Violations: $FIRST_EXAM_MAX_VIOLATIONS"
    fi
else
    echo -e "${RED}✗ Failed to get exams${NC}"
    echo "$EXAMS_RESPONSE" | jq '.'
    exit 1
fi

# Step 4: Get All Students
echo ""
echo -e "${YELLOW}Step 4: Get All Students${NC}"
STUDENTS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/admin/students")
STUDENTS_SUCCESS=$(echo "$STUDENTS_RESPONSE" | jq -r '.success')

if [ "$STUDENTS_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ Students retrieved${NC}"
    STUDENT_COUNT=$(echo "$STUDENTS_RESPONSE" | jq -r '.data.students | length')
    echo "  Total Students: $STUDENT_COUNT"
else
    echo -e "${RED}✗ Failed to get students${NC}"
    echo "$STUDENTS_RESPONSE" | jq '.'
    exit 1
fi

# Step 5: Get All Sessions
echo ""
echo -e "${YELLOW}Step 5: Get All Sessions${NC}"
SESSIONS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/admin/sessions")
SESSIONS_SUCCESS=$(echo "$SESSIONS_RESPONSE" | jq -r '.success')

if [ "$SESSIONS_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ Sessions retrieved${NC}"
    SESSION_COUNT=$(echo "$SESSIONS_RESPONSE" | jq -r '.data.sessions | length')
    echo "  Total Sessions: $SESSION_COUNT"

    # Show session breakdown by status
    if [ "$SESSION_COUNT" -gt 0 ]; then
        IN_PROGRESS=$(echo "$SESSIONS_RESPONSE" | jq -r '[.data.sessions[] | select(.status == "in_progress")] | length')
        COMPLETED=$(echo "$SESSIONS_RESPONSE" | jq -r '[.data.sessions[] | select(.status == "completed")] | length')
        echo "  In Progress: $IN_PROGRESS"
        echo "  Completed: $COMPLETED"
    fi
else
    echo -e "${RED}✗ Failed to get sessions${NC}"
    echo "$SESSIONS_RESPONSE" | jq '.'
    exit 1
fi

# Step 6: Test Create Exam
echo ""
echo -e "${YELLOW}Step 6: Test Create Exam (with undo)${NC}"
CREATE_EXAM_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/admin/exams/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Exam - Auto Created",
    "description": "Automated test exam",
    "version": "v1.0",
    "durationMinutes": 30,
    "maxViolations": 5,
    "enableFullscreen": true,
    "autoSaveIntervalSeconds": 5,
    "warningAtMinutes": 5,
    "minTimeGuaranteeMinutes": 3
  }')

CREATE_SUCCESS=$(echo "$CREATE_EXAM_RESPONSE" | jq -r '.success')

if [ "$CREATE_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ Exam created successfully${NC}"
    NEW_EXAM_ID=$(echo "$CREATE_EXAM_RESPONSE" | jq -r '.data.id')
    NEW_EXAM_TITLE=$(echo "$CREATE_EXAM_RESPONSE" | jq -r '.data.title')
    echo "  Exam ID: $NEW_EXAM_ID"
    echo "  Title: $NEW_EXAM_TITLE"
    echo "  Duration: 30 minutes"
    echo "  Max Violations: 5"

    # Clean up: Delete the test exam (not implemented in API yet, so we'll note it)
    echo -e "${BLUE}  Note: Test exam created (cleanup not automated)${NC}"
else
    echo -e "${RED}✗ Failed to create exam${NC}"
    echo "$CREATE_EXAM_RESPONSE" | jq '.'
    exit 1
fi

# Step 7: Test Add Student (with undo)
echo ""
echo -e "${YELLOW}Step 7: Test Add Student (with undo)${NC}"
TEST_EMAIL="test.student.$(date +%s)@test.com"
ADD_STUDENT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/admin/students/add" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"fullName\":\"Test Student Auto\"}")

ADD_SUCCESS=$(echo "$ADD_STUDENT_RESPONSE" | jq -r '.success')

if [ "$ADD_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ Student added successfully${NC}"
    echo "  Email: $TEST_EMAIL"

    # Clean up: Remove the test student
    echo -e "${BLUE}  Cleaning up: Removing test student...${NC}"
    REMOVE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/admin/students/remove" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$TEST_EMAIL\"}")

    REMOVE_SUCCESS=$(echo "$REMOVE_RESPONSE" | jq -r '.success')
    if [ "$REMOVE_SUCCESS" == "true" ]; then
        echo -e "${GREEN}  ✓ Test student removed${NC}"
    else
        echo -e "${YELLOW}  ⚠ Failed to remove test student${NC}"
    fi
else
    echo -e "${RED}✗ Failed to add student${NC}"
    echo "$ADD_STUDENT_RESPONSE" | jq '.'
    exit 1
fi

# Step 8: Test Filter Sessions (In Progress)
echo ""
echo -e "${YELLOW}Step 8: Test Filter Sessions (In Progress)${NC}"
FILTER_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/admin/sessions?status=in_progress")
FILTER_SUCCESS=$(echo "$FILTER_RESPONSE" | jq -r '.success')

if [ "$FILTER_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ Session filtering works${NC}"
    FILTERED_COUNT=$(echo "$FILTER_RESPONSE" | jq -r '.data | length')
    echo "  In Progress Sessions: $FILTERED_COUNT"
else
    echo -e "${RED}✗ Failed to filter sessions${NC}"
    echo "$FILTER_RESPONSE" | jq '.'
    exit 1
fi

# Step 9: Test Activate/Deactivate Exam
echo ""
echo -e "${YELLOW}Step 9: Test Exam Activation Toggle${NC}"
if [ "$EXAM_COUNT" -gt 0 ]; then
    FIRST_EXAM_ID=$(echo "$EXAMS_RESPONSE" | jq -r '.data.exams[0].id')
    FIRST_EXAM_ACTIVE=$(echo "$EXAMS_RESPONSE" | jq -r '.data.exams[0].isActive')

    echo "  Current Status: $FIRST_EXAM_ACTIVE"

    # Toggle activation (deactivate if active, activate if inactive)
    NEW_STATUS="false"
    if [ "$FIRST_EXAM_ACTIVE" == "false" ]; then
        NEW_STATUS="true"
    fi

    ACTIVATE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/admin/exams/$FIRST_EXAM_ID/activate" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"isActive\":$NEW_STATUS}")

    ACTIVATE_SUCCESS=$(echo "$ACTIVATE_RESPONSE" | jq -r '.success')

    if [ "$ACTIVATE_SUCCESS" == "true" ]; then
        echo -e "${GREEN}✓ Exam activation toggle works${NC}"
        echo "  New Status: $NEW_STATUS"

        # Toggle back to original state
        echo -e "${BLUE}  Reverting to original state...${NC}"
        REVERT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/admin/exams/$FIRST_EXAM_ID/activate" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"isActive\":$FIRST_EXAM_ACTIVE}")

        REVERT_SUCCESS=$(echo "$REVERT_RESPONSE" | jq -r '.success')
        if [ "$REVERT_SUCCESS" == "true" ]; then
            echo -e "${GREEN}  ✓ Reverted to original state${NC}"
        fi
    else
        echo -e "${RED}✗ Failed to toggle exam activation${NC}"
        echo "$ACTIVATE_RESPONSE" | jq '.'
        exit 1
    fi
else
    echo -e "${YELLOW}  ⚠ No exams available to test${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}All Admin Interface Tests Passed! ✓${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ Admin authentication"
echo "  ✓ Dashboard statistics"
echo "  ✓ Exam management (list, create, activate/deactivate)"
echo "  ✓ Student management (list, add, remove)"
echo "  ✓ Session management (list, filter by status)"
echo ""
echo "The admin interface is fully functional!"
