-- Migration: Make student full_name optional
-- Date: 2026-01-19
-- Purpose: Allow students to be added with only email, name provided on first login

-- Make full_name column nullable
ALTER TABLE students ALTER COLUMN full_name DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN students.full_name IS 'Student full name - provided by student on first login, nullable until then';

-- No index needed on full_name as it's not used for lookups
