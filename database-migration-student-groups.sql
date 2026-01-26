-- ============================================
-- STUDENT GROUPS MIGRATION
-- Add student groups and exam-group associations
-- ============================================

-- ============================================
-- 1. CREATE STUDENT_GROUPS TABLE
-- Groups to organize students for exam access control
-- ============================================
CREATE TABLE IF NOT EXISTS student_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

CREATE INDEX idx_student_groups_name ON student_groups(name);
CREATE INDEX idx_student_groups_created_at ON student_groups(created_at);

COMMENT ON TABLE student_groups IS 'Student groups for organizing exam access control';
COMMENT ON COLUMN student_groups.name IS 'Unique group name (e.g., "CS101 Section A", "Biology Midterm Group")';

-- ============================================
-- 2. CREATE STUDENT_GROUP_MEMBERS TABLE
-- Many-to-many relationship between students and groups
-- ============================================
CREATE TABLE IF NOT EXISTS student_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by VARCHAR(255),
    UNIQUE(group_id, student_id)
);

CREATE INDEX idx_group_members_group ON student_group_members(group_id);
CREATE INDEX idx_group_members_student ON student_group_members(student_id);
CREATE INDEX idx_group_members_combined ON student_group_members(group_id, student_id);

COMMENT ON TABLE student_group_members IS 'Maps students to groups for access control';
COMMENT ON COLUMN student_group_members.added_by IS 'Admin email who added the student to group';

-- ============================================
-- 3. CREATE EXAM_GROUP_ACCESS TABLE
-- Many-to-many relationship between exams and groups
-- Defines which groups can access which exams
-- ============================================
CREATE TABLE IF NOT EXISTS exam_group_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    UNIQUE(exam_id, group_id)
);

CREATE INDEX idx_exam_group_exam ON exam_group_access(exam_id);
CREATE INDEX idx_exam_group_group ON exam_group_access(group_id);
CREATE INDEX idx_exam_group_combined ON exam_group_access(exam_id, group_id);

COMMENT ON TABLE exam_group_access IS 'Defines which student groups can access which exams';
COMMENT ON COLUMN exam_group_access.created_by IS 'Admin email who granted access';

-- ============================================
-- 4. ADD COLUMN TO EXAMS TABLE
-- Track if exam uses group-based access control
-- ============================================
ALTER TABLE exams ADD COLUMN IF NOT EXISTS use_group_access BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_exams_use_group_access ON exams(use_group_access);

COMMENT ON COLUMN exams.use_group_access IS 'If true, only students in assigned groups can access this exam. If false, all authorized students can access.';

-- ============================================
-- 5. UPDATE TRIGGER FOR STUDENT_GROUPS
-- ============================================
CREATE OR REPLACE FUNCTION update_student_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_student_groups_timestamp ON student_groups;
CREATE TRIGGER trigger_update_student_groups_timestamp
    BEFORE UPDATE ON student_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_student_groups_updated_at();

-- ============================================
-- 6. HELPER VIEW: GROUP MEMBERSHIP COUNTS
-- Quick stats for each group
-- ============================================
CREATE OR REPLACE VIEW v_group_stats AS
SELECT
    g.id,
    g.name,
    g.description,
    COUNT(DISTINCT sgm.student_id) as member_count,
    COUNT(DISTINCT ega.exam_id) as exam_count,
    g.created_at
FROM student_groups g
LEFT JOIN student_group_members sgm ON sgm.group_id = g.id
LEFT JOIN exam_group_access ega ON ega.group_id = g.id
GROUP BY g.id, g.name, g.description, g.created_at
ORDER BY g.name;

COMMENT ON VIEW v_group_stats IS 'Quick statistics for each student group';

-- ============================================
-- 7. HELPER VIEW: STUDENT GROUP MEMBERSHIPS
-- List all groups each student belongs to
-- ============================================
CREATE OR REPLACE VIEW v_student_group_memberships AS
SELECT
    s.id as student_id,
    s.email as student_email,
    s.full_name as student_name,
    g.id as group_id,
    g.name as group_name,
    sgm.added_at
FROM students s
JOIN student_group_members sgm ON sgm.student_id = s.id
JOIN student_groups g ON g.id = sgm.group_id
ORDER BY s.full_name, g.name;

COMMENT ON VIEW v_student_group_memberships IS 'Maps students to their group memberships';

-- ============================================
-- 8. HELPER VIEW: EXAM GROUP ASSIGNMENTS
-- List all groups assigned to each exam
-- ============================================
CREATE OR REPLACE VIEW v_exam_group_assignments AS
SELECT
    e.id as exam_id,
    e.title as exam_title,
    e.use_group_access,
    g.id as group_id,
    g.name as group_name,
    COUNT(DISTINCT sgm.student_id) as authorized_student_count,
    ega.created_at as access_granted_at
FROM exams e
JOIN exam_group_access ega ON ega.exam_id = e.id
JOIN student_groups g ON g.id = ega.group_id
LEFT JOIN student_group_members sgm ON sgm.group_id = g.id
GROUP BY e.id, e.title, e.use_group_access, g.id, g.name, ega.created_at
ORDER BY e.title, g.name;

COMMENT ON VIEW v_exam_group_assignments IS 'Shows which groups have access to which exams';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Usage Examples:
--
-- 1. Create a group:
--    INSERT INTO student_groups (name, description, created_by)
--    VALUES ('CS101 Section A', 'Computer Science 101 - Morning Section', 'admin@example.com');
--
-- 2. Add students to group:
--    INSERT INTO student_group_members (group_id, student_id, added_by)
--    VALUES ('group-uuid', 'student-uuid', 'admin@example.com');
--
-- 3. Assign group to exam:
--    INSERT INTO exam_group_access (exam_id, group_id, created_by)
--    VALUES ('exam-uuid', 'group-uuid', 'admin@example.com');
--
-- 4. Enable group-based access for exam:
--    UPDATE exams SET use_group_access = true WHERE id = 'exam-uuid';
--
-- 5. Check if student can access exam:
--    SELECT EXISTS (
--      SELECT 1 FROM exam_group_access ega
--      JOIN student_group_members sgm ON sgm.group_id = ega.group_id
--      WHERE ega.exam_id = 'exam-uuid' AND sgm.student_id = 'student-uuid'
--    );
