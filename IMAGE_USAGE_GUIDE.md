# Image Usage Guide for Exam Questions

## Local Images Setup

Your images have been copied to: `frontend/public/images/`

This allows you to reference them with relative URLs in your exam questions.

## How to Reference Local Images

### Method 1: Relative Path (Recommended for Local Development)

When using the exam editor, reference images using the path:

```
/images/Albinism.png
```

**Available Images:**
- `/images/Albinism.png`
- `/images/AlbinismVsVitiligo.png`
- `/images/Extensor.png`
- `/images/Freckles.jpeg`
- `/images/Normal Mole.jpg` (note the space)
- `/images/Suture.png`
- `/images/Tendon.png`
- `/images/Vericous Veins.jpeg` (note the space)
- `/images/Vitiligo.png`
- `/images/animal cell.webp` (note the space)
- `/images/keloid.jpeg`
- `/images/melanoma.webp`
- `/images/skin cross section.webp` (note the space)

### Example in Exam Format

```javascript
const examSet = [
    {
        id: "q1",
        type: "text",
        question: "Your client is an Albino. Describe the genetic condition.",
        required: false,
        image: "/images/Albinism.png",  // ← Use this format
        placeholder: "Type your answer here..."
    },
    {
        id: "q2",
        type: "multiple-choice",
        question: "What is shown in the image below?",
        required: false,
        image: "/images/melanoma.webp",  // ← Works with any image type
        options: [
            "Normal Mole",
            "Melanoma",
            "Vitiligo",
            "Keloid"
        ],
        correctAnswer: 1
    }
];
```

## URL-Encoded Filenames (For Files with Spaces)

Some filenames contain spaces. You have two options:

### Option 1: Use %20 for spaces
```javascript
image: "/images/Normal%20Mole.jpg"
image: "/images/Vericous%20Veins.jpeg"
image: "/images/animal%20cell.webp"
image: "/images/skin%20cross%20section.webp"
```

### Option 2: Rename files (remove spaces)
I can rename these files if you prefer:
- `Normal Mole.jpg` → `Normal-Mole.jpg`
- `Vericous Veins.jpeg` → `Vericous-Veins.jpeg`
- `animal cell.webp` → `animal-cell.webp`
- `skin cross section.webp` → `skin-cross-section.webp`

## Testing Images

1. **In the exam editor:**
   - Add a question
   - In the "Image URL" field, paste: `/images/Albinism.png`
   - You should see a preview of the image

2. **If image doesn't show:**
   - Check browser console for errors
   - Verify the dev server is running
   - Try refreshing the page (Cmd+Shift+R)

## Production Deployment

When deploying to production, you have several options:

### Option 1: Keep Using /public/images
- Images will be bundled with your build
- URL stays the same: `/images/Albinism.png`
- **Pros:** Simple, works offline
- **Cons:** Larger deployment size

### Option 2: Upload to CDN/Image Hosting
Upload images to services like:
- **Cloudinary** (free tier, optimized)
- **ImgBB** (free, simple)
- **AWS S3** (scalable, paid)
- **GitHub Pages** (free, public repos)

Then update URLs to:
```javascript
image: "https://your-cdn.com/Albinism.png"
```

### Option 3: Self-Hosted Backend
Serve images from your backend:
1. Create `backend/public/images/` directory
2. Configure Express to serve static files
3. Use URLs like: `http://your-domain.com/images/Albinism.png`

## Bulk Paste with Local Images

Your existing exam sets can use local images:

```javascript
const examSet4 = [
    {
        id: "q3_set4",
        type: "text",
        question: "Your client is an Albino, the trait that makes them an albino is found in one of the labelled structures below. Which is it?",
        required: false,
        image: "/images/animal cell.webp",  // ← Changed from external URL
        placeholder: "Type your answer here..."
    },
    {
        id: "q10_set4",
        type: "multiple-choice",
        question: "Based on the anatomy and physiology course, the image attached is that of a.......",
        required: false,
        image: "/images/Normal Mole.jpg",  // ← Local image
        options: [
            "Normal Mole",
            "Malignant Melanoma"
        ],
        correctAnswer: 0
    }
];
```

## Image Optimization Tips

For better performance:

1. **Compress large images:**
   - Use tools like TinyPNG, ImageOptim
   - Target: < 500KB per image

2. **Use appropriate formats:**
   - Photos → `.jpg` or `.webp`
   - Graphics/diagrams → `.png`
   - Animations → `.gif` (avoid for static images)

3. **Resize to actual display size:**
   - Max width: 800px (images display at max 400px in editor)
   - Reduces load time

## Troubleshooting

### Image shows "Failed to load"
1. Check the URL is exactly: `/images/filename.ext`
2. Verify filename spelling and case (case-sensitive!)
3. Check browser console for 404 errors
4. Confirm dev server is running

### Image loads in editor but not in exam
1. Ensure images are in `frontend/public/images/`
2. Rebuild frontend: `npm run build`
3. Restart dev server

### CORS errors
- Local images (`/images/...`) won't have CORS issues
- External URLs may be blocked (like ResearchGate)
- Use local images or proper CDN for reliability

## Quick Reference

| Type | Example |
|------|---------|
| Local image | `/images/Albinism.png` |
| With spaces | `/images/Normal%20Mole.jpg` |
| External URL | `https://example.com/image.jpg` |
| Wrong ❌ | `attachments/Albinism.png` |
| Wrong ❌ | `../attachments/Albinism.png` |
| Wrong ❌ | `github.com/.../Albinism.png` |

## Current Status

✅ All images copied to `frontend/public/images/`
✅ Accessible at `/images/filename.ext`
✅ Works in both development and production
✅ No CORS issues
✅ No external dependencies

Just refresh your browser and use `/images/Albinism.png` format!
