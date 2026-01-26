-- Fix Invalid Image URLs in Questions Table
-- Run with: psql -h localhost -U pilgrim_13_1 -d proctor_db -f fix-image-urls.sql

-- Step 1: View all questions with image URLs
SELECT
    id,
    question_number,
    LEFT(question_text, 50) as question_preview,
    image_url,
    CASE
        WHEN image_url IS NULL THEN 'No Image'
        WHEN image_url LIKE '%.jpg' OR
             image_url LIKE '%.jpeg' OR
             image_url LIKE '%.png' OR
             image_url LIKE '%.gif' OR
             image_url LIKE '%.webp' OR
             image_url LIKE '%.svg' OR
             image_url LIKE 'data:image%' THEN 'Valid'
        ELSE 'Invalid'
    END as status
FROM questions
WHERE image_url IS NOT NULL
ORDER BY question_number;

-- Step 2: Fix Wikipedia URLs (Option A: Set to NULL)
-- Uncomment to execute:
-- UPDATE questions
-- SET image_url = NULL
-- WHERE image_url LIKE '%wikipedia.org/wiki/%';

-- Step 2: Fix Wikipedia URLs (Option B: Use specific images)
-- Example for question 1: "what is the fastest train"
-- UPDATE questions
-- SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/TGV_V150_en_gare_de_Vandières_01.JPG/640px-TGV_V150_en_gare_de_Vandières_01.JPG'
-- WHERE question_text LIKE '%fastest train%';

-- Example for question 2: "What is the largest planet"
-- UPDATE questions
-- SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Jupiter_by_Cassini-Huygens.jpg/640px-Jupiter_by_Cassini-Huygens.jpg'
-- WHERE question_text LIKE '%largest planet%';

-- Step 3: Verify the fixes
SELECT
    id,
    question_number,
    LEFT(question_text, 50) as question_preview,
    image_url
FROM questions
WHERE image_url IS NOT NULL
ORDER BY question_number;

-- Step 4: Count questions by image status
SELECT
    CASE
        WHEN image_url IS NULL THEN 'No Image'
        WHEN image_url LIKE '%.jpg' OR
             image_url LIKE '%.jpeg' OR
             image_url LIKE '%.png' OR
             image_url LIKE '%.gif' OR
             image_url LIKE '%.webp' OR
             image_url LIKE '%.svg' OR
             image_url LIKE 'data:image%' THEN 'Valid Image URL'
        ELSE 'Invalid Image URL'
    END as status,
    COUNT(*) as count
FROM questions
GROUP BY status
ORDER BY status;
