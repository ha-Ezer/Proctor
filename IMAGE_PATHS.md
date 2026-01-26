# Quick Image Reference - Copy & Paste These URLs

All images are now available locally. Use these exact paths in your exam questions:

## Available Images

```
/images/Albinism.png
/images/AlbinismVsVitiligo.png
/images/Extensor.png
/images/Freckles.jpeg
/images/Normal-Mole.jpg
/images/Suture.png
/images/Tendon.png
/images/Vericous-Veins.jpeg
/images/Vitiligo.png
/images/animal-cell.webp
/images/keloid.jpeg
/images/melanoma.webp
/images/skin-cross-section.webp
```

## Usage Examples

### In Exam Editor (Manual)
1. Click "Add Question" or "Edit" an exam
2. In the "Image URL" field, paste one of the paths above
3. Example: `/images/Albinism.png`

### In Bulk Paste
```javascript
const examSet = [
    {
        id: "q1",
        type: "text",
        question: "Describe the genetic condition shown below.",
        required: false,
        image: "/images/Albinism.png",
        placeholder: "Type your answer here..."
    },
    {
        id: "q2",
        type: "multiple-choice",
        question: "Which structure is labeled A?",
        required: false,
        image: "/images/animal-cell.webp",
        options: [
            "Nucleus",
            "Mitochondria",
            "Cell Membrane",
            "Ribosome"
        ],
        correctAnswer: 0
    },
    {
        id: "q3",
        type: "multiple-choice",
        question: "The image shows:",
        required: false,
        image: "/images/melanoma.webp",
        options: [
            "Normal Mole",
            "Melanoma",
            "Freckles",
            "Keloid"
        ],
        correctAnswer: 1
    }
];
```

## Image Descriptions (for your reference)

| Image | Best Used For |
|-------|--------------|
| Albinism.png | Genetic conditions, pigmentation disorders |
| AlbinismVsVitiligo.png | Comparing pigmentation disorders |
| Extensor.png | Muscle anatomy, flexor vs extensor |
| Freckles.jpeg | Skin pigmentation, melanin |
| Normal-Mole.jpg | Identifying normal vs abnormal moles |
| Suture.png | Skeletal system, skull anatomy |
| Tendon.png | Musculoskeletal system |
| Vericous-Veins.jpeg | Circulatory system disorders |
| Vitiligo.png | Autoimmune skin conditions |
| animal-cell.webp | Cell biology, organelles |
| keloid.jpeg | Scar tissue, wound healing |
| melanoma.webp | Skin cancer identification |
| skin-cross-section.webp | Skin layers, dermatology |

## Testing

To test if images work:
1. Go to admin dashboard
2. Click "Edit" on any exam
3. Click "Add Question"
4. Paste this in the Image URL field: `/images/Albinism.png`
5. You should see the image preview immediately

## Common Issues

**Issue:** Image not showing
**Fix:** Make sure you're using `/images/` (with the leading slash)

**Issue:** Wrong file name
**Fix:** Copy the exact path from the list above (case-sensitive!)

**Issue:** Still showing "Failed to load"
**Fix:** Refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)
