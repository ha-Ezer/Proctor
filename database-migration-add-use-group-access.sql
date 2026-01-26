-- Add use_group_access column to exams table
-- This allows exams to be restricted to specific student groups

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS use_group_access BOOLEAN DEFAULT false;

COMMENT ON COLUMN exams.use_group_access IS 'If true, only students in assigned groups can access this exam';

-- Update existing exams to have use_group_access = false by default
UPDATE exams
SET use_group_access = false
WHERE use_group_access IS NULL;
