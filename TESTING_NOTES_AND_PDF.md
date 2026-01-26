# Testing Guide: Session Notes and PDF Export

## Prerequisites
- Backend server running on `localhost:3000`
- Frontend running (dev or built)
- At least one completed exam session in the database
- Admin user logged in

## Test 1: Add a Note

1. Navigate to **Admin Dashboard** → **Sessions**
2. Click on any completed session to view details
3. Scroll to any question response
4. You should see "+ Add Note" text below the response
5. Click "+ Add Note"
6. **Expected**: A textarea appears with Save/Cancel buttons
7. Type a test note (e.g., "Student showed good understanding")
8. Click "Save Note"
9. **Expected**:
   - Note saves successfully
   - Textarea closes
   - Note appears in a blue box
   - "Click to edit" prompt shows

## Test 2: Note Persistence

1. With the note from Test 1 visible
2. Refresh the page (F5)
3. **Expected**:
   - Page reloads
   - Your note is still visible in the blue box
   - This confirms database persistence

## Test 3: Edit a Note

1. Click on the blue box containing your note
2. **Expected**: Textarea opens with the current note text
3. Modify the text (e.g., add "Very detailed answer")
4. Click "Save Note"
5. **Expected**:
   - Textarea closes
   - Updated text appears in the blue box
   - Changes are saved

## Test 4: Delete a Note

1. Hover over the note (blue box)
2. Look for "Delete" link in the top-right corner
3. Click "Delete"
4. **Expected**: Browser asks "Delete this note?"
5. Click "OK"
6. **Expected**:
   - Note disappears
   - "+ Add Note" button reappears
   - Note removed from database

## Test 5: Multiple Notes

1. Add notes to 3 different question responses
2. **Expected**: All three notes save independently
3. Edit one of the notes
4. **Expected**: Only that note changes, others remain unchanged
5. Delete one note
6. **Expected**: Only that note is deleted, others remain

## Test 6: PDF Export

1. On the session detail page, look for "Export as PDF" button in the header
2. Click the button
3. **Expected**: Browser print dialog opens
4. In the print dialog:
   - Choose "Save as PDF" as the destination
   - Preview should show:
     - Session information
     - All questions and student responses
     - Admin notes (if any)
     - Violation logs
     - NO navigation buttons or admin controls
5. Click "Save" and choose a location
6. **Expected**: PDF file is created
7. Open the PDF
8. **Expected**:
   - Clean, professional layout
   - All content is readable
   - Colors are preserved
   - Page breaks are logical
   - Admin notes appear below each response

## Test 7: Multi-Admin Collaboration

1. Add a note to a response (while logged in as Admin A)
2. Log out
3. Log in as a different admin (Admin B)
4. Navigate to the same session
5. **Expected**: The note from Admin A is visible
6. Edit the note as Admin B
7. **Expected**: Changes save successfully
8. This confirms notes are shared across all admins

## Test 8: Error Handling

1. Disconnect from the internet (or block API calls)
2. Try to add a note
3. **Expected**: Alert message: "Failed to save note"
4. Reconnect to the internet
5. Try again
6. **Expected**: Note saves successfully

## Test 9: Empty Note

1. Click "+ Add Note"
2. Leave the textarea empty
3. Click "Save Note"
4. **Expected**: Empty note is saved (but consider adding validation)

## Test 10: Long Note

1. Click "+ Add Note"
2. Paste a very long text (500+ words)
3. Click "Save Note"
4. **Expected**:
   - Note saves successfully
   - Full text is visible when clicked to edit
   - Text wraps properly in the display

## Expected Results Summary

All tests should pass with:
- ✅ Notes save immediately
- ✅ Notes persist after page refresh
- ✅ Notes can be edited and deleted
- ✅ Multiple notes work independently
- ✅ PDF export includes all information
- ✅ PDF is print-optimized
- ✅ Notes are shared across admins
- ✅ Error messages appear on failures

## Common Issues and Solutions

### Issue: "Admin ID not found" error
**Solution**: Ensure you're logged in as an admin user

### Issue: Notes don't persist
**Solution**: Check backend console for database connection errors

### Issue: PDF is blank
**Solution**: Check browser print settings, ensure "Print backgrounds" is enabled

### Issue: Cannot click "Save Note"
**Solution**: Check browser console for JavaScript errors

### Issue: Database foreign key error
**Solution**: Ensure the session and question IDs exist in their respective tables

## API Testing (Optional)

### Test Save Note API
```bash
curl -X POST http://localhost:3000/api/admin/sessions/:sessionId/notes \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"questionId": "QUESTION_UUID", "note": "Test note"}'
```

### Test Delete Note API
```bash
curl -X DELETE http://localhost:3000/api/admin/sessions/:sessionId/notes \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"questionId": "QUESTION_UUID"}'
```

### Test Get Session Details (includes notes)
```bash
curl -X GET http://localhost:3000/api/admin/sessions/:sessionId/details \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

**All features implemented and ready for testing!**

The implementation includes:
- ✅ Database schema created
- ✅ Backend API endpoints working
- ✅ Frontend UI components added
- ✅ PDF export functionality
- ✅ Print CSS styling
- ✅ Error handling
- ✅ Optimistic UI updates

**Ready for Production**: After completing the tests above ✅
