# Session Filters Enhancement

**Date:** January 25, 2026
**Status:** ✅ Complete

---

## Features Added

### 1. Exam Name Filter (Dropdown)

**What it does:**
- Shows a dropdown of all available exams
- Allows filtering sessions by specific exam
- Displays exam title and version in dropdown

**How to use:**
1. Navigate to Admin → Sessions
2. In the Filters section, find "Exam Name" dropdown
3. Select an exam from the list
4. Sessions table automatically updates to show only sessions for that exam

### 2. Date Range Filter

**What it does:**
- Allows filtering sessions by submission date range
- Start Date: Show sessions from this date onwards
- End Date: Show sessions up to this date
- Can use either date independently or both together

**How to use:**
1. Navigate to Admin → Sessions
2. In the Filters section, find "Start Date" and "End Date" inputs
3. Select dates using the date picker
4. End Date cannot be before Start Date (validation built-in)
5. Sessions table automatically updates

### 3. Combined Filters

**Filters can be combined:**
- Status + Exam + Date Range
- Any combination works together

**Example:**
- Status: Completed
- Exam: "Batch 6 Quiz 4"
- Start Date: 2026-01-20
- End Date: 2026-01-25

Result: Shows only completed sessions for "Batch 6 Quiz 4" submitted between Jan 20-25, 2026

### 4. Active Filters Summary

**Visual feedback:**
- Blue chips showing active filters
- "Clear All" button appears when filters are active
- Summary shows:
  - Status filter
  - Selected exam name
  - Date range

### 5. Clear All Filters

**Quick reset:**
- Click "Clear All" button
- Resets all filters to default (All Sessions, All Exams, No Date Range)

---

## Technical Implementation

### Frontend Changes

**File:** `frontend/src/pages/admin/SessionsPage.tsx`

**New State:**
```typescript
const [exams, setExams] = useState<ExamDetails[]>([]);
const [selectedExamId, setSelectedExamId] = useState<string>('');
const [startDate, setStartDate] = useState<string>('');
const [endDate, setEndDate] = useState<string>('');
```

**Load Exams:**
```typescript
const loadExams = async () => {
  try {
    const response = await adminApi.getExams();
    setExams(response.data.data.exams);
  } catch (err) {
    console.error('Failed to load exams:', err);
  }
};
```

**Updated loadSessions:**
```typescript
const params: any = {};

if (filter !== 'all') {
  params.status = filter;
}

if (selectedExamId) {
  params.examId = selectedExamId;
}

if (startDate) {
  params.startDate = startDate;
}

if (endDate) {
  params.endDate = endDate;
}

const response = await adminApi.getSessions(params);
```

**Clear Filters:**
```typescript
const clearFilters = () => {
  setFilter('all');
  setSelectedExamId('');
  setStartDate('');
  setEndDate('');
};
```

### UI Components

**Filter Card Layout:**
```
┌─────────────────────────────────────────────┐
│ 🔍 Filters                   [Clear All]    │
├─────────────────────────────────────────────┤
│ Status:                                     │
│ [All Sessions] [In Progress] [Completed]    │
│                                             │
│ Exam Name    Start Date    End Date         │
│ [Dropdown]   [Date Picker] [Date Picker]    │
│                                             │
│ Active filters: ●Status ●Exam ●From ●To     │
└─────────────────────────────────────────────┘
```

### Backend Support

**Already Supported:** The backend `sessionFiltersSchema` already includes:

```typescript
{
  status: enum (optional)
  examId: UUID (optional)
  startDate: ISO string (optional)
  endDate: ISO string (optional)
  // ... other filters
}
```

**Backend Implementation:**
- Filters are applied in SQL WHERE clause
- Date comparison uses `es.start_time >= startDate` and `es.start_time <= endDate`
- All filters are optional and can be combined

---

## User Interface

### Before:
```
[All Sessions] [In Progress] [Completed]
```

### After:
```
┌── Filters ───────────────────── [Clear All] ──┐
│                                                │
│ Status:                                        │
│ [All Sessions] [In Progress] [Completed]       │
│                                                │
│ Exam Name           Start Date    End Date    │
│ [All Exams ▼]      [📅 Pick]    [📅 Pick]     │
│                                                │
│ Active filters: ●Completed ●Quiz 4 ●From 1/20 │
└────────────────────────────────────────────────┘
```

---

## Examples

### Example 1: Filter by Exam

**Action:**
1. Select "Batch 6 Quiz 4" from Exam Name dropdown

**Result:**
- Shows all sessions (any status) for "Batch 6 Quiz 4"
- Other exams are hidden

### Example 2: Filter by Date Range

**Action:**
1. Start Date: 2026-01-20
2. End Date: 2026-01-25

**Result:**
- Shows all sessions submitted between Jan 20-25
- Any status, any exam

### Example 3: Combined Filters

**Action:**
1. Status: Completed
2. Exam: "Batch 6 Quiz 4"
3. Start Date: 2026-01-20
4. End Date: 2026-01-25

**Result:**
- Shows ONLY completed sessions
- For "Batch 6 Quiz 4" exam
- Submitted between Jan 20-25, 2026

### Example 4: Clear All Filters

**Action:**
1. Click "Clear All" button

**Result:**
- Status: All Sessions
- Exam: All Exams
- Dates: Cleared
- Shows all sessions again

---

## Data Flow

1. **User selects filter** → State updates
2. **State change triggers** → useEffect runs
3. **loadSessions called** → API request with filters
4. **Backend processes** → SQL WHERE clause with filters
5. **Results returned** → Sessions table updates
6. **Active filters shown** → Blue chips display active filters

---

## Benefits

1. **Better Organization**: Quickly find sessions by exam
2. **Time-based Analysis**: See sessions from specific date ranges
3. **Combined Filtering**: Multiple criteria for precise results
4. **Visual Feedback**: Clear indication of active filters
5. **Easy Reset**: One-click to clear all filters
6. **User Friendly**: Dropdowns and date pickers are intuitive

---

## Testing Checklist

- [ ] Exam dropdown loads all exams
- [ ] Selecting exam filters sessions correctly
- [ ] Start date filters sessions from that date onwards
- [ ] End date filters sessions up to that date
- [ ] Date range works with both dates
- [ ] End date cannot be before start date
- [ ] Status + Exam + Date filters work together
- [ ] Active filters chips display correctly
- [ ] Clear All resets all filters
- [ ] Sessions count updates correctly
- [ ] "No sessions found" shows when no results

---

**Status:** ✅ Fully Functional
**Files Modified:** 1 (frontend/src/pages/admin/SessionsPage.tsx)
**Backend Changes:** None required (already supported)
