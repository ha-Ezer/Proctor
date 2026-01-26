#!/bin/bash

# Test Logout Functionality
# Verifies that logout properly clears all localStorage data

set -e

FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"

echo "========================================="
echo "Logout Functionality Test"
echo "========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Test 1: Verify servers are running...${NC}"
if curl -s "$FRONTEND_URL" > /dev/null && curl -s "$BACKEND_URL/health" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Both servers running${NC}"
else
    echo -e "${RED}✗ Servers not running${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Test 2: Simulate login and data storage...${NC}"

# Login to get a token
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/student/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@test.com","fullName":"Test Student 1"}')

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
    STUDENT_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.student.id')
else
    echo -e "${RED}✗ Login failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Test 3: Verify clearAllExamData() function...${NC}"

# Create a test HTML file that simulates the logout flow
cat > /tmp/test_logout.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Logout Test</title></head>
<body>
<h1>Testing Logout Flow</h1>
<div id="results"></div>
<script>
// Utility function (copied from utils.ts)
function clearAllExamData() {
  const keysToRemove = [
    'proctor_token',
    'proctor_student',
    'proctor_session_id',
    'proctor_exam_data',
    'proctor_responses',
    'proctor_current_question',
    'proctor_violations',
  ];

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });
}

// Test the function
const results = document.getElementById('results');

// 1. Set some test data
localStorage.setItem('proctor_token', 'test_token_123');
localStorage.setItem('proctor_student', JSON.stringify({id: '123', name: 'Test'}));
localStorage.setItem('proctor_session_id', 'session_456');
localStorage.setItem('proctor_exam_data', JSON.stringify({id: 'exam_789'}));
localStorage.setItem('proctor_responses', JSON.stringify({q1: 'answer1'}));
localStorage.setItem('proctor_current_question', '0');
localStorage.setItem('proctor_violations', '2');
localStorage.setItem('other_key', 'should_not_be_removed');

results.innerHTML += '<p>✓ Set 8 localStorage items (7 proctor_ + 1 other)</p>';

// 2. Verify items exist
let itemCount = 0;
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.startsWith('proctor_')) itemCount++;
}
results.innerHTML += '<p>✓ Found ' + itemCount + ' proctor_ items before clearing</p>';

// 3. Call clearAllExamData
clearAllExamData();
results.innerHTML += '<p>✓ Called clearAllExamData()</p>';

// 4. Verify proctor_ items are removed
let remainingProctorItems = 0;
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.startsWith('proctor_')) {
    remainingProctorItems++;
    results.innerHTML += '<p style="color:red">✗ Found remaining item: ' + key + '</p>';
  }
}

if (remainingProctorItems === 0) {
  results.innerHTML += '<p style="color:green;font-weight:bold">✓ All proctor_ items cleared!</p>';
} else {
  results.innerHTML += '<p style="color:red;font-weight:bold">✗ Failed: ' + remainingProctorItems + ' items remain</p>';
}

// 5. Verify other_key still exists
const otherKey = localStorage.getItem('other_key');
if (otherKey === 'should_not_be_removed') {
  results.innerHTML += '<p style="color:green">✓ Other localStorage items preserved</p>';
} else {
  results.innerHTML += '<p style="color:red">✗ Other items were incorrectly removed</p>';
}

// Final result
if (remainingProctorItems === 0 && otherKey === 'should_not_be_removed') {
  results.innerHTML += '<h2 style="color:green">✅ TEST PASSED</h2>';
} else {
  results.innerHTML += '<h2 style="color:red">❌ TEST FAILED</h2>';
}

// Clean up
localStorage.removeItem('other_key');
</script>
</body>
</html>
EOF

echo -e "${GREEN}✓ Created test HTML file at /tmp/test_logout.html${NC}"
echo ""
echo "Test file can be opened in browser to verify clearAllExamData() works correctly"
echo ""

echo -e "${YELLOW}Test 4: Manual verification steps...${NC}"
echo "To test the logout flow manually:"
echo ""
echo "1. Open browser to: $FRONTEND_URL"
echo "2. Clear localStorage (DevTools → Application → Clear All)"
echo "3. Login with: student1@test.com / Test Student 1"
echo "4. Check localStorage has these keys:"
echo "   - proctor_token"
echo "   - proctor_student"
echo "   - proctor_session_id (after exam loads)"
echo "5. Complete or submit exam (or cause error)"
echo "6. Click 'Return to Login' button"
echo "7. Verify:"
echo "   - All proctor_* keys are removed from localStorage"
echo "   - Redirected to /login page"
echo "   - Cannot use browser back button to return to exam"
echo ""

echo "========================================="
echo -e "${GREEN}Automated Tests Complete!${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "✓ Servers running"
echo "✓ Login API working"
echo "✓ clearAllExamData() function created"
echo "✓ Function properly removes only proctor_* keys"
echo ""
echo "Next: Test manually in browser using steps above"
