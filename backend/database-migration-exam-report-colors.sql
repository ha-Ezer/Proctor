-- Migration: Add exam report cell colors table
-- This table stores color coding for cells in the exam report table view

CREATE TABLE IF NOT EXISTS exam_report_cell_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  color VARCHAR(7) NOT NULL, -- Hex color code (e.g., #FF0000)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, student_id, question_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exam_report_colors_exam ON exam_report_cell_colors(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_report_colors_student ON exam_report_cell_colors(student_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_exam_report_color_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exam_report_color_timestamp_trigger
BEFORE UPDATE ON exam_report_cell_colors
FOR EACH ROW
EXECUTE FUNCTION update_exam_report_color_timestamp();

COMMENT ON TABLE exam_report_cell_colors IS 'Stores color coding for exam report table cells';
COMMENT ON COLUMN exam_report_cell_colors.color IS 'Hex color code for the cell background';
