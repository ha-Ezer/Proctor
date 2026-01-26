# Exam Editor Guide

## Overview
The new Exam Editor provides a Google Forms-style interface for creating and managing exam questions with support for:
- ✅ Multiple question types (Multiple Choice, Short Text, Long Text)
- ✅ Image attachments for each question
- ✅ Bulk paste functionality to import questions from your existing format
- ✅ Drag-and-drop question reordering
- ✅ Real-time preview

## How to Access

1. Login to admin dashboard at `http://localhost:5173/admin/login`
2. Navigate to "Exams" from the sidebar
3. Click the **"Edit"** button on any exam

## Adding Questions Manually

### Step 1: Click "Add Question"
This creates a new blank question at the bottom of the list.

### Step 2: Configure the Question
- **Question Type**: Choose from:
  - Multiple Choice (with 2+ options)
  - Short Text (single line)
  - Long Text (textarea)
- **Required**: Toggle whether students must answer
- **Question Text**: Enter your question
- **Image URL**: Paste image URL (optional)

### Step 3: For Multiple Choice Questions
- Enter text for each option
- Click the radio button next to the correct answer
- Click "+ Add Option" to add more choices
- Click trash icon to remove options (minimum 2 required)

### Step 4: Save
Click "Save X Questions" at the bottom when done.

## Bulk Paste Feature

### How It Works
Instead of adding questions one by one, you can paste your entire exam in the format you're already using!

### Steps to Use Bulk Paste

1. Click the **"Bulk Paste"** button at the top of the editor
2. Paste your exam code in the modal
3. Click **"Parse & Add Questions"**
4. Review the imported questions
5. Click **"Save"** to add them to the exam

### Supported Format

Your existing format is fully supported! Here's an example:

```javascript
const examSet1 = [
    {
        id: "q1_set1",
        type: "multiple-choice",
        question: "The mixture of Sebum and Sweat is called.......",
        required: false,
        options: [
            "Acid Mantle",
            "Histamine",
            "Swebum",
            "Melanocytes"
        ],
        correctAnswer: 0
    },
    {
        id: "q2_set1",
        type: "multiple-choice",
        question: "Your client changed from fair to dark skin when she got pregnant. What pigment is responsible for this change?",
        required: false,
        image: "https://example.com/image.jpg",
        options: [
            "Carotene",
            "Collagen",
            "Melanin",
            "Fungbact A"
        ],
        correctAnswer: 2
    },
    {
        id: "q3_set1",
        type: "text",
        question: "Briefly describe what caused the deformation in this man's face",
        required: false,
        image: "https://example.com/image2.jpg",
        placeholder: "Type your brief explanation here..."
    }
];
```

### Format Requirements

- **type**: `"multiple-choice"`, `"text"`, or `"textarea"`
- **question**: Your question text
- **required**: `true` or `false`
- **options**: Array of answer choices (for multiple-choice only)
- **correctAnswer**: Index of correct option (0-based, for multiple-choice only)
- **image**: Image URL (optional)
- **placeholder**: Placeholder text for text questions (optional)

### Tips for Bulk Paste

1. **Keep comments**: Comments in your code are automatically removed during parsing
2. **Variable names don't matter**: `examSet1`, `examSet2`, etc. are all fine
3. **Mix question types**: You can have multiple-choice and text questions in the same paste
4. **Images work**: All your image URLs will be imported
5. **Review before saving**: After parsing, review all questions before clicking Save

## Image Support

### Adding Images to Questions

**Method 1: Paste URL Directly**
- Paste any publicly accessible image URL
- Supports: JPG, PNG, GIF, WebP
- Image preview appears automatically

**Method 2: Use Images from Bulk Paste**
- Your existing images in the paste format are automatically included

### Image Best Practices

- Use HTTPS URLs for security
- Ensure images are publicly accessible
- Recommended max size: 2MB per image
- Supported formats: JPG, PNG, GIF, WebP
- Images are displayed at max 400px width in the exam

## Question Management

### Reordering Questions
- Questions are numbered automatically (Q1, Q2, Q3...)
- Drag the grip icon (⋮⋮) to reorder (coming soon)

### Deleting Questions
- Click the trash icon on the right side of any question
- Questions are automatically renumbered after deletion

### Editing Questions
- All fields can be edited at any time before saving
- Changes are not saved until you click "Save"

## Validation

The editor validates:
- ✅ All question texts are filled in
- ✅ All multiple-choice options have text
- ✅ Each multiple-choice question has a correct answer marked
- ✅ Image URLs are valid (preview will show error if not)

## Example Workflow

### Creating a New Exam

1. **Create the exam shell**
   - Click "Create Exam" on Exams page
   - Enter title, duration, max violations
   - Click "Create Exam"

2. **Add questions**
   - Click "Edit" on the newly created exam
   - Click "Bulk Paste"
   - Paste your exam set (e.g., examSet1, examSet2, etc.)
   - Click "Parse & Add Questions"
   - Review the imported questions
   - Click "Save X Questions"

3. **Activate the exam**
   - Click "Activate" on the exam card
   - Students can now access it

### Adding Questions to Existing Exam

1. Click "Edit" on any exam
2. Existing questions are shown (if any)
3. Add new questions manually or via bulk paste
4. New questions are added at the end
5. Click "Save"

## Troubleshooting

### Bulk Paste Not Working

**Issue**: "Failed to parse questions"

**Solutions**:
- Check for syntax errors in your pasted code
- Ensure proper JSON format
- Remove any invalid characters
- Make sure arrays are properly closed with `]`

### Image Not Loading

**Issue**: Image shows "Image Load Error"

**Solutions**:
- Verify the URL is publicly accessible
- Check if URL starts with `https://`
- Try opening the URL in a new browser tab
- Use a different image host if needed

### Correct Answer Not Saving

**Issue**: Multiple choice question not accepting answer

**Solutions**:
- Make sure you clicked the radio button next to the correct option
- Only one option can be marked as correct
- Save the exam after making changes

## Advanced Features

### Multiple Images Per Question
Currently, one image per question is supported. To add multiple images:
1. Use an image collage tool to combine images
2. Upload the combined image to an image host
3. Paste the URL in the Image URL field

### Question Numbering
- Questions are automatically numbered starting from 1
- Numbering updates when questions are added/removed
- Students see questions in the order you save them

### Required vs Optional
- **Required**: Student must answer to submit exam
- **Optional**: Student can skip the question
- Toggle the "Required" checkbox for each question

## Support

If you encounter any issues:
1. Check the browser console for errors (F12)
2. Verify your admin token is valid
3. Ensure the backend server is running
4. Contact support with error details

## Future Enhancements

Coming soon:
- Drag-and-drop question reordering
- Image upload from computer
- Question templates
- Duplicate question feature
- Bulk edit operations
- Export exam to JSON
