# Image URL Validation Fix

## Problem

Getting 400 Bad Request error when saving questions with local image paths like `/images/Albinism.png`.

### Error Details
```
POST http://localhost:3000/api/admin/questions/add 400 (Bad Request)
```

### Root Cause
The backend validation schema (`addQuestionSchema`) was using Zod's `.url()` validator which only accepts full URLs with protocols:
- ✅ `https://example.com/image.jpg`
- ❌ `/images/Albinism.png` (relative path)

## Solution

Updated the validation schema in `backend/src/validators/admin.validator.ts` to accept:
1. **Full URLs**: `https://example.com/image.jpg`
2. **Relative URLs**: `/images/Albinism.png` (for local images)
3. **Legacy attachments format**: `attachments/Normal Mole.jpg` (automatically converted)
4. **Empty strings**: `''` (when no image)

### Automatic Path Transformation

The system now **automatically transforms** `attachments/` paths to `/images/` paths:
- ✅ Backend validator converts the path before saving to database
- ✅ Frontend displays the image using the transformed path
- ✅ This allows you to use the legacy `attachments/` format from your existing exam data

### Code Change

**Before:**
```typescript
imageUrl: z.string().url().optional().or(z.literal('')),
```

**After:**
```typescript
imageUrl: z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return '';
    // Convert attachments/filename to /images/filename
    if (val.startsWith('attachments/')) {
      return val.replace('attachments/', '/images/');
    }
    return val;
  })
  .refine(
    (val) => val === '' || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    { message: 'Image URL must be a valid URL, relative path starting with /, or attachments/filename format' }
  ),
```

## Testing

### Test 1: Legacy Attachments Format (NEW!)
```javascript
{
  image: "attachments/Normal Mole.jpg"  // ✅ Auto-converted to /images/Normal Mole.jpg
}
```

### Test 2: Local Image (Direct)
```javascript
{
  image: "/images/Albinism.png"  // ✅ Works directly
}
```

### Test 3: External URL
```javascript
{
  image: "https://example.com/image.jpg"  // ✅ Still works
}
```

### Test 4: No Image
```javascript
{
  image: ""  // ✅ Still works
}
```

### Test 5: Invalid Path
```javascript
{
  image: "images/Albinism.png"  // ❌ Will fail (missing leading /)
}
```

## Current Status

✅ Backend validation updated
✅ Backend restarted successfully
✅ Server running on http://localhost:3000
✅ Ready to accept local image paths

## How to Use

1. **Refresh your browser** to clear any cached errors
2. **Create/Edit exam questions** with local images
3. Use image paths in **any of these formats**:
   - `attachments/Normal Mole.jpg` (legacy format - auto-converted)
   - `/images/Albinism.png` (direct format)
   - `https://example.com/image.jpg` (external URL)

### Example Questions with Images

**Legacy Format (Recommended for existing data):**
```javascript
{
    id: "q1",
    type: "text",
    question: "Describe the genetic condition shown below.",
    required: false,
    image: "attachments/Albinism.png",  // ← Auto-converted to /images/Albinism.png
    placeholder: "Type your answer here..."
}
```

**Direct Format:**
```javascript
{
    id: "q2",
    type: "multiple-choice",
    question: "What condition is shown?",
    required: false,
    image: "/images/Normal Mole.jpg",  // ← Works directly
    options: ["Normal Mole", "Melanoma", "Keloid", "Vitiligo"],
    correctAnswer: 0
}
```

## Files Modified

1. **Backend Validator** - `backend/src/validators/admin.validator.ts` (lines 47-58)
   - Added `.transform()` to automatically convert `attachments/` to `/images/`
   - Updated `.refine()` validation to accept all formats

2. **Frontend Exam Editor** - `frontend/src/components/admin/ExamEditor.tsx`
   - Added `transformImageUrl()` helper function
   - Transforms `attachments/` paths for image preview
   - Updated placeholder text to show all supported formats

3. **Student Exam View** - `frontend/src/components/exam/QuestionCard.tsx`
   - Added `transformImageUrl()` helper function
   - Ensures students see images correctly regardless of path format

## Why This Matters

- **Local Development**: Images stored in `frontend/public/images/` can now be used
- **No External Dependencies**: Don't need external image hosting
- **Better Performance**: Local images load faster
- **Offline Support**: Works without internet connection
- **Cost Savings**: No CDN fees for development

## Production Considerations

This validation allows both relative and absolute URLs, which is perfect for:
- **Development**: Use `/images/...` for local files
- **Production**: Can still use full CDN URLs if needed
- **Flexibility**: Mix both types in the same exam

## Related Files

- Image storage: `frontend/public/images/`
- Image reference guide: `IMAGE_PATHS.md`
- Image usage guide: `IMAGE_USAGE_GUIDE.md`
