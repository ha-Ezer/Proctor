-- ============================================
-- POSTGRESQL SCHEMA FOR PROCTORED EXAM SYSTEM
-- Migration from Google Apps Script to PostgreSQL
-- ============================================

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. STUDENTS TABLE
-- Stores authorized students who can take exams
-- ============================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_authorized BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_authorized ON students(is_authorized);
CREATE INDEX idx_students_last_login ON students(last_login);

COMMENT ON TABLE students IS 'Authorized students who can access and take exams';
COMMENT ON COLUMN students.email IS 'Student email address, used for authentication';
COMMENT ON COLUMN students.is_authorized IS 'Whether student is currently authorized to take exams';
COMMENT ON COLUMN students.metadata IS 'Additional student information stored as JSON';

-- ============================================
-- 2. EXAMS TABLE
-- Stores exam configurations and settings
-- ============================================
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL DEFAULT 'v1.0',
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    max_violations INTEGER NOT NULL DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    enable_fullscreen BOOLEAN DEFAULT true,
    auto_save_interval_seconds INTEGER DEFAULT 5,
    warning_at_minutes INTEGER DEFAULT 10,
    min_time_guarantee_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_exams_active ON exams(is_active);
CREATE INDEX idx_exams_version ON exams(version);
CREATE INDEX idx_exams_created_at ON exams(created_at);

COMMENT ON TABLE exams IS 'Exam configurations including timing, violations limits, and settings';
COMMENT ON COLUMN exams.duration_minutes IS 'Total time allowed for exam completion in minutes';
COMMENT ON COLUMN exams.max_violations IS 'Maximum number of proctoring violations before termination';
COMMENT ON COLUMN exams.auto_save_interval_seconds IS 'How often to auto-save student progress';

-- ============================================
-- 3. QUESTIONS TABLE
-- Stores all exam questions
-- ============================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple-choice', 'text', 'textarea')),
    required BOOLEAN DEFAULT false,
    placeholder TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(exam_id, question_number)
);

CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_number ON questions(exam_id, question_number);

COMMENT ON TABLE questions IS 'Exam questions with support for multiple choice, text, and textarea types';
COMMENT ON COLUMN questions.question_number IS 'Display order of question (1-50)';
COMMENT ON COLUMN questions.image_url IS 'Optional image URL for visual questions';

-- ============================================
-- 4. QUESTION OPTIONS TABLE
-- Stores multiple-choice answer options
-- ============================================
CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, option_index)
);

CREATE INDEX idx_options_question ON question_options(question_id);
CREATE INDEX idx_options_correct ON question_options(is_correct);

COMMENT ON TABLE question_options IS 'Answer options for multiple-choice questions';
COMMENT ON COLUMN question_options.option_index IS 'Zero-based index of the option (0-3)';
COMMENT ON COLUMN question_options.is_correct IS 'Whether this option is the correct answer';

-- ============================================
-- 5. EXAM SESSIONS TABLE
-- Tracks individual student exam attempts
-- ============================================
CREATE TABLE exam_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    scheduled_end_time TIMESTAMP NOT NULL,
    actual_duration_seconds INTEGER,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'terminated', 'expired', 'abandoned')),
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    total_violations INTEGER DEFAULT 0,
    score DECIMAL(5,2),
    submission_type VARCHAR(50) CHECK (submission_type IN ('manual', 'auto_timeout', 'max_violations', 'admin_terminated')),
    was_resumed BOOLEAN DEFAULT false,
    resume_count INTEGER DEFAULT 0,
    browser_info TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_sessions_student ON exam_sessions(student_id);
CREATE INDEX idx_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX idx_sessions_status ON exam_sessions(status);
CREATE INDEX idx_sessions_start_time ON exam_sessions(start_time);
CREATE INDEX idx_sessions_session_id ON exam_sessions(session_id);
CREATE INDEX idx_sessions_student_exam ON exam_sessions(student_id, exam_id);

COMMENT ON TABLE exam_sessions IS 'Individual student exam attempts with timing and status tracking';
COMMENT ON COLUMN exam_sessions.session_id IS 'Human-readable session identifier (session_timestamp_random)';
COMMENT ON COLUMN exam_sessions.scheduled_end_time IS 'When the exam should end based on duration';
COMMENT ON COLUMN exam_sessions.was_resumed IS 'Whether this session was recovered from a saved snapshot';

-- ============================================
-- 6. RESPONSES TABLE
-- Stores student answers to questions
-- ============================================
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    response_text TEXT,
    response_option_index INTEGER,
    is_correct BOOLEAN,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_spent_seconds INTEGER,
    revision_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, question_id)
);

CREATE INDEX idx_responses_session ON responses(session_id);
CREATE INDEX idx_responses_question ON responses(question_id);
CREATE INDEX idx_responses_answered ON responses(answered_at);
CREATE INDEX idx_responses_correct ON responses(is_correct);

COMMENT ON TABLE responses IS 'Student answers to exam questions';
COMMENT ON COLUMN responses.response_text IS 'Text answer for text/textarea questions';
COMMENT ON COLUMN responses.response_option_index IS 'Selected option index for multiple-choice (0-based)';
COMMENT ON COLUMN responses.is_correct IS 'Whether the answer is correct (for multiple-choice only)';
COMMENT ON COLUMN responses.revision_count IS 'Number of times the student changed their answer';

-- ============================================
-- 7. VIOLATIONS TABLE
-- Stores proctoring violations detected during exams
-- ============================================
CREATE TABLE violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    violation_type VARCHAR(255) NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    browser_info TEXT,
    device_info TEXT,
    additional_data JSONB DEFAULT '{}'::jsonb,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_violations_session ON violations(session_id);
CREATE INDEX idx_violations_type ON violations(violation_type);
CREATE INDEX idx_violations_severity ON violations(severity);
CREATE INDEX idx_violations_time ON violations(detected_at);
CREATE INDEX idx_violations_session_time ON violations(session_id, detected_at);

COMMENT ON TABLE violations IS 'Proctoring violations detected during exam sessions';
COMMENT ON COLUMN violations.violation_type IS 'Type of violation (e.g., "Tab switch detected", "F12 Developer Tools")';
COMMENT ON COLUMN violations.severity IS 'Severity level for prioritization and alerting';
COMMENT ON COLUMN violations.additional_data IS 'Extra violation context (e.g., pasted text length)';

-- ============================================
-- 8. SESSION SNAPSHOTS TABLE
-- Stores periodic progress snapshots for recovery
-- ============================================
CREATE TABLE session_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    snapshot_data JSONB NOT NULL,
    responses_count INTEGER DEFAULT 0,
    violations_count INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_snapshots_session ON session_snapshots(session_id);
CREATE INDEX idx_snapshots_time ON session_snapshots(created_at);
CREATE INDEX idx_snapshots_session_time ON session_snapshots(session_id, created_at DESC);

COMMENT ON TABLE session_snapshots IS 'Auto-saved progress snapshots for exam recovery';
COMMENT ON COLUMN session_snapshots.snapshot_data IS 'Complete exam state including all responses and violations';
COMMENT ON COLUMN session_snapshots.responses_count IS 'Number of questions answered at snapshot time';

-- ============================================
-- 9. PROCTORING REPORTS TABLE
-- Denormalized summary data for quick reporting
-- ============================================
CREATE TABLE proctoring_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    exam_title VARCHAR(255) NOT NULL,
    exam_start TIMESTAMP NOT NULL,
    exam_end TIMESTAMP,
    duration_minutes INTEGER,
    total_violations INTEGER DEFAULT 0,
    violation_types TEXT[],
    status VARCHAR(50) CHECK (status IN ('clean', 'minor_issues', 'concerning', 'flagged_for_review')),
    form_submitted BOOLEAN DEFAULT false,
    score DECIMAL(5,2),
    completion_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id)
);

CREATE INDEX idx_reports_student ON proctoring_reports(student_id);
CREATE INDEX idx_reports_exam ON proctoring_reports(exam_id);
CREATE INDEX idx_reports_status ON proctoring_reports(status);
CREATE INDEX idx_reports_exam_start ON proctoring_reports(exam_start);
CREATE INDEX idx_reports_student_email ON proctoring_reports(student_email);

COMMENT ON TABLE proctoring_reports IS 'Denormalized exam reports for efficient dashboard queries';
COMMENT ON COLUMN proctoring_reports.violation_types IS 'Array of violation type strings for quick filtering';
COMMENT ON COLUMN proctoring_reports.status IS 'Overall exam status based on violations and completion';

-- ============================================
-- 10. ADMIN USERS TABLE
-- Admin accounts for dashboard access
-- ============================================
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_email ON admin_users(email);
CREATE INDEX idx_admin_active ON admin_users(is_active);
CREATE INDEX idx_admin_role ON admin_users(role);

COMMENT ON TABLE admin_users IS 'Admin users with access to proctoring dashboard';
COMMENT ON COLUMN admin_users.password_hash IS 'Bcrypt hashed password (cost factor: 12)';
COMMENT ON COLUMN admin_users.role IS 'Access level: super_admin (full), admin (most), viewer (read-only)';

-- ============================================
-- ADDITIONAL CONSTRAINTS
-- ============================================

ALTER TABLE exam_sessions
ADD CONSTRAINT check_end_time_after_start
CHECK (end_time IS NULL OR end_time >= start_time);

ALTER TABLE exam_sessions
ADD CONSTRAINT check_scheduled_end_after_start
CHECK (scheduled_end_time > start_time);

ALTER TABLE responses
ADD CONSTRAINT check_response_has_value
CHECK (response_text IS NOT NULL OR response_option_index IS NOT NULL);

ALTER TABLE proctoring_reports
ADD CONSTRAINT check_duration_positive
CHECK (duration_minutes IS NULL OR duration_minutes >= 0);

ALTER TABLE questions
ADD CONSTRAINT check_question_number_positive
CHECK (question_number > 0);

ALTER TABLE question_options
ADD CONSTRAINT check_option_index_valid
CHECK (option_index >= 0 AND option_index <= 10);

-- ============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON exams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON exam_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responses_updated_at
BEFORE UPDATE ON responses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON proctoring_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Active exam sessions with student details
CREATE OR REPLACE VIEW active_exam_sessions_view AS
SELECT
    es.id,
    es.session_id,
    es.start_time,
    es.scheduled_end_time,
    es.status,
    es.total_violations,
    es.completion_percentage,
    s.email as student_email,
    s.full_name as student_name,
    e.title as exam_title,
    e.version as exam_version,
    EXTRACT(EPOCH FROM (es.scheduled_end_time - CURRENT_TIMESTAMP))/60 as minutes_remaining
FROM exam_sessions es
JOIN students s ON es.student_id = s.id
JOIN exams e ON es.exam_id = e.id
WHERE es.status = 'in_progress'
ORDER BY es.start_time DESC;

COMMENT ON VIEW active_exam_sessions_view IS 'Currently active exam sessions with time remaining calculations';

-- View: Comprehensive session details for admin dashboard
CREATE OR REPLACE VIEW session_details_view AS
SELECT
    es.id as session_id,
    es.session_id as session_code,
    es.start_time,
    es.end_time,
    es.status,
    es.completion_percentage,
    es.total_violations,
    es.score,
    s.email as student_email,
    s.full_name as student_name,
    e.title as exam_title,
    e.version as exam_version,
    e.duration_minutes,
    COUNT(DISTINCT r.id) as total_responses,
    COUNT(DISTINCT v.id) as violation_count,
    ARRAY_AGG(DISTINCT v.violation_type) FILTER (WHERE v.violation_type IS NOT NULL) as violation_types
FROM exam_sessions es
JOIN students s ON es.student_id = s.id
JOIN exams e ON es.exam_id = e.id
LEFT JOIN responses r ON r.session_id = es.id
LEFT JOIN violations v ON v.session_id = es.id
GROUP BY
    es.id, es.session_id, es.start_time, es.end_time, es.status,
    es.completion_percentage, es.total_violations, es.score,
    s.email, s.full_name, e.title, e.version, e.duration_minutes;

COMMENT ON VIEW session_details_view IS 'Aggregated session data with response and violation counts';

-- View: Student violation statistics
CREATE OR REPLACE VIEW student_violation_stats AS
SELECT
    s.id as student_id,
    s.email,
    s.full_name,
    COUNT(DISTINCT es.id) as total_sessions,
    AVG(es.total_violations) as avg_violations_per_session,
    SUM(es.total_violations) as total_violations,
    MAX(es.total_violations) as max_violations_in_session
FROM students s
LEFT JOIN exam_sessions es ON es.student_id = s.id
GROUP BY s.id, s.email, s.full_name;

COMMENT ON VIEW student_violation_stats IS 'Per-student violation statistics across all sessions';

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default exam (Anatomy & Physiology)
INSERT INTO exams (
    id,
    title,
    description,
    version,
    duration_minutes,
    max_violations,
    enable_fullscreen,
    auto_save_interval_seconds,
    warning_at_minutes,
    min_time_guarantee_minutes
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Anatomy & Physiology Comprehensive Exam',
    'Comprehensive examination covering cells, skin anatomy, nervous system, muscular system, and circulatory system. Includes 30 multiple-choice questions and 20 open-ended questions.',
    'v2.1',
    60,
    7,
    true,
    5,
    10,
    5
) ON CONFLICT DO NOTHING;

COMMENT ON COLUMN exams.id IS 'Default exam ID matching current system exam';

-- Create default super admin (password should be changed immediately)
-- Default password: Admin@123 (hashed with bcrypt cost 12)
INSERT INTO admin_users (
    email,
    password_hash,
    full_name,
    role,
    is_active
) VALUES (
    'admin@proctor.system',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5agyWY6MQW6e2',
    'System Administrator',
    'super_admin',
    true
) ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE admin_users IS 'Default admin password is Admin@123 - CHANGE IMMEDIATELY';

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function: Get latest snapshot for a session
CREATE OR REPLACE FUNCTION get_latest_snapshot(p_session_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT snapshot_data
        FROM session_snapshots
        WHERE session_id = p_session_id
        ORDER BY created_at DESC
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_latest_snapshot IS 'Retrieves the most recent progress snapshot for recovery';

-- Function: Calculate session score
CREATE OR REPLACE FUNCTION calculate_session_score(p_session_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_questions INTEGER;
    correct_answers INTEGER;
    score DECIMAL;
BEGIN
    -- Count total questions
    SELECT COUNT(*) INTO total_questions
    FROM responses
    WHERE session_id = p_session_id;

    -- Count correct answers
    SELECT COUNT(*) INTO correct_answers
    FROM responses
    WHERE session_id = p_session_id AND is_correct = true;

    -- Calculate percentage
    IF total_questions > 0 THEN
        score := (correct_answers::DECIMAL / total_questions::DECIMAL) * 100;
    ELSE
        score := 0;
    END IF;

    RETURN ROUND(score, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_session_score IS 'Calculates exam score as percentage of correct answers';

-- Function: Update session statistics
CREATE OR REPLACE FUNCTION update_session_stats(p_session_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE exam_sessions
    SET
        completion_percentage = (
            SELECT ROUND((COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM questions WHERE exam_id = exam_sessions.exam_id)) * 100, 2)
            FROM responses
            WHERE session_id = p_session_id
        ),
        total_violations = (
            SELECT COUNT(*)
            FROM violations
            WHERE session_id = p_session_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_session_stats IS 'Updates completion and violation counts for a session';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PROCTORED EXAM SYSTEM DATABASE SCHEMA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Schema created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created: 10';
    RAISE NOTICE '  - students';
    RAISE NOTICE '  - exams';
    RAISE NOTICE '  - questions';
    RAISE NOTICE '  - question_options';
    RAISE NOTICE '  - exam_sessions';
    RAISE NOTICE '  - responses';
    RAISE NOTICE '  - violations';
    RAISE NOTICE '  - session_snapshots';
    RAISE NOTICE '  - proctoring_reports';
    RAISE NOTICE '  - admin_users';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created: 3';
    RAISE NOTICE '  - active_exam_sessions_view';
    RAISE NOTICE '  - session_details_view';
    RAISE NOTICE '  - student_violation_stats';
    RAISE NOTICE '';
    RAISE NOTICE 'Default admin credentials:';
    RAISE NOTICE '  Email: admin@proctor.system';
    RAISE NOTICE '  Password: Admin@123';
    RAISE NOTICE '  ⚠️  CHANGE PASSWORD IMMEDIATELY!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Run migration script to import questions';
    RAISE NOTICE '  2. Add authorized student emails';
    RAISE NOTICE '  3. Configure backend environment variables';
    RAISE NOTICE '  4. Deploy backend to Railway';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
