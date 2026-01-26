-- Migration: Add session question notes table
-- Stores admin notes for each question response in a session

CREATE TABLE IF NOT EXISTS session_question_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, question_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_session_question_notes_session ON session_question_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_question_notes_question ON session_question_notes(question_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_question_note_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_question_note_timestamp_trigger
BEFORE UPDATE ON session_question_notes
FOR EACH ROW
EXECUTE FUNCTION update_session_question_note_timestamp();

COMMENT ON TABLE session_question_notes IS 'Stores admin notes for each question response in a session';
COMMENT ON COLUMN session_question_notes.note IS 'Admin note/comment about the student response';
COMMENT ON COLUMN session_question_notes.created_by IS 'Admin who created the note';
COMMENT ON COLUMN session_question_notes.updated_by IS 'Admin who last updated the note';
