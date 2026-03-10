-- ============================================================
-- 001_initial_schema.sql
-- Bellini College Class Scheduling System
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM (
  'admin',
  'chair',
  'ta_coordinator',
  'dept_advisor',
  'facilities',
  'instructor',
  'ta_ugta',
  'student_advisor'
);

CREATE TYPE course_level AS ENUM ('UG', 'GR', 'UGRD', 'GRAD');

CREATE TYPE ta_type AS ENUM ('GRAD', 'UGTA');

-- ============================================================
-- TABLE: semesters
-- Master registry of all semesters. Adding S26 = inserting a row.
-- ============================================================
CREATE TABLE semesters (
  id         SERIAL       PRIMARY KEY,
  code       TEXT         NOT NULL UNIQUE,  -- e.g. "S25", "F25", "S26"
  term_label TEXT         NOT NULL,         -- e.g. "Spring 2025"
  term_code  TEXT,                          -- e.g. "202501"
  start_date DATE,
  end_date   DATE,
  is_active  BOOLEAN      DEFAULT true,
  created_at TIMESTAMPTZ  DEFAULT now()
);

-- ============================================================
-- TABLE: campuses
-- ============================================================
CREATE TABLE campuses (
  id   SERIAL PRIMARY KEY,
  code TEXT   NOT NULL UNIQUE,
  name TEXT
);

-- ============================================================
-- TABLE: subjects
-- Subject codes (SUBJ column from Excel).
-- ============================================================
CREATE TABLE subjects (
  id   SERIAL PRIMARY KEY,
  code TEXT   NOT NULL UNIQUE,
  name TEXT
);

-- ============================================================
-- TABLE: rooms
-- Unified room registry built from MEETING_ROOM columns.
-- ============================================================
CREATE TABLE rooms (
  id           SERIAL PRIMARY KEY,
  room_code    TEXT   NOT NULL UNIQUE,  -- e.g. "CWY 107", "ONLINE"
  building     TEXT,
  room_number  TEXT,
  capacity     INT,
  is_online    BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: instructors
-- One row per unique instructor, keyed by email.
-- ============================================================
CREATE TABLE instructors (
  id         SERIAL  PRIMARY KEY,
  email      TEXT    NOT NULL UNIQUE,
  full_name  TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: users
-- Links Supabase Auth users to app-level roles.
-- ============================================================
CREATE TABLE users (
  id            UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT    NOT NULL UNIQUE,
  role          user_role NOT NULL DEFAULT 'student_advisor',
  instructor_id INT     REFERENCES instructors(id),
  display_name  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: courses
-- One row per unique SUBJ + CRSE_NUMB combination.
-- ============================================================
CREATE TABLE courses (
  id            SERIAL PRIMARY KEY,
  subject_id    INT    NOT NULL REFERENCES subjects(id),
  course_number TEXT   NOT NULL,
  title         TEXT   NOT NULL,
  course_level  course_level,
  UNIQUE (subject_id, course_number)
);

-- ============================================================
-- TABLE: sections
-- Core table. One row per section per semester.
-- Nullable columns accommodate S25 (no enrollment) and F25 (has enrollment).
-- ============================================================
CREATE TABLE sections (
  id                       SERIAL       PRIMARY KEY,
  semester_id              INT          NOT NULL REFERENCES semesters(id),
  campus_id                INT          REFERENCES campuses(id),
  course_id                INT          NOT NULL REFERENCES courses(id),
  crn                      TEXT         NOT NULL,
  section_code             TEXT         NOT NULL,
  course_level             course_level,

  -- Scheduling
  meeting_days             TEXT,
  meeting_times            TEXT,
  meeting_time_start       TIME,
  meeting_time_end         TIME,
  room_id                  INT          REFERENCES rooms(id),

  -- Enrollment (F25 has these; S25 does not - nullable)
  enrollment               INT,
  prior_section_enrollment INT,
  wait_list_actual         INT,
  wait_list_max            INT,
  multiple_sections        TEXT,

  -- Dates
  start_date               DATE,
  end_date                 DATE,

  -- Instructor
  instructor_id            INT          REFERENCES instructors(id),

  -- Metadata
  created_at               TIMESTAMPTZ  DEFAULT now(),
  updated_at               TIMESTAMPTZ  DEFAULT now(),
  created_by               UUID         REFERENCES auth.users(id),

  UNIQUE (semester_id, crn)
);

-- ============================================================
-- TABLE: tas
-- TAs and UGTAs. Separate from users; linked by email.
-- Populated at import time; real Supabase Auth accounts link by email match.
-- ============================================================
CREATE TABLE tas (
  id         SERIAL  PRIMARY KEY,
  email      TEXT    NOT NULL UNIQUE,
  full_name  TEXT,
  ta_type    ta_type NOT NULL DEFAULT 'GRAD',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: ta_assignments
-- Links TAs to sections with allocated hours.
-- ============================================================
CREATE TABLE ta_assignments (
  id           SERIAL     PRIMARY KEY,
  section_id   INT        NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  ta_id        INT        NOT NULL REFERENCES tas(id),
  hours        NUMERIC(6,2),
  assigned_at  TIMESTAMPTZ DEFAULT now(),
  assigned_by  UUID        REFERENCES auth.users(id),
  UNIQUE (section_id, ta_id)
);

-- ============================================================
-- TABLE: audit_log
-- Records every CREATE/UPDATE/DELETE on sections and ta_assignments.
-- ============================================================
CREATE TABLE audit_log (
  id           BIGSERIAL    PRIMARY KEY,
  table_name   TEXT         NOT NULL,
  record_id    INT          NOT NULL,
  action       TEXT         NOT NULL,
  changed_by   UUID         REFERENCES auth.users(id),
  old_data     JSONB,
  new_data     JSONB,
  changed_at   TIMESTAMPTZ  DEFAULT now()
);

-- ============================================================
-- TABLE: notifications
-- Outbound email queue for TA assignment events.
-- ============================================================
CREATE TABLE notifications (
  id               BIGSERIAL    PRIMARY KEY,
  recipient_email  TEXT         NOT NULL,
  subject          TEXT         NOT NULL,
  body             TEXT         NOT NULL,
  sent_at          TIMESTAMPTZ,
  status           TEXT         DEFAULT 'pending',
  ta_assignment_id INT          REFERENCES ta_assignments(id),
  created_at       TIMESTAMPTZ  DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_sections_semester       ON sections(semester_id);
CREATE INDEX idx_sections_crn            ON sections(crn);
CREATE INDEX idx_sections_room_time      ON sections(room_id, meeting_days, meeting_time_start, meeting_time_end);
CREATE INDEX idx_sections_instructor     ON sections(instructor_id);
CREATE INDEX idx_sections_course         ON sections(course_id);
CREATE INDEX idx_sections_course_semester ON sections(course_id, semester_id);
CREATE INDEX idx_ta_assignments_ta       ON ta_assignments(ta_id);
CREATE INDEX idx_ta_assignments_section  ON ta_assignments(section_id);
CREATE INDEX idx_audit_log_table_record  ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_changed_at    ON audit_log(changed_at DESC);
CREATE INDEX idx_notifications_status    ON notifications(status);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update sections.updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sections_updated_at
  BEFORE UPDATE ON sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit trigger for sections
CREATE OR REPLACE FUNCTION audit_sections_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log(table_name, record_id, action, new_data, changed_by)
    VALUES ('sections', NEW.id, 'INSERT', row_to_json(NEW)::jsonb, auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log(table_name, record_id, action, old_data, new_data, changed_by)
    VALUES ('sections', NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log(table_name, record_id, action, old_data, changed_by)
    VALUES ('sections', OLD.id, 'DELETE', row_to_json(OLD)::jsonb, auth.uid());
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sections_audit
  AFTER INSERT OR UPDATE OR DELETE ON sections
  FOR EACH ROW EXECUTE FUNCTION audit_sections_changes();

-- Trigger to queue notification on ta_assignments change
CREATE OR REPLACE FUNCTION notify_ta_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_ta_email    TEXT;
  v_ta_name     TEXT;
  v_section_info TEXT;
BEGIN
  SELECT t.email, t.full_name INTO v_ta_email, v_ta_name
  FROM tas t WHERE t.id = NEW.ta_id;

  SELECT concat(subj.code, ' ', c.course_number, ' (', sem.code, ')')
  INTO v_section_info
  FROM sections s
  JOIN courses c ON c.id = s.course_id
  JOIN subjects subj ON subj.id = c.subject_id
  JOIN semesters sem ON sem.id = s.semester_id
  WHERE s.id = NEW.section_id;

  INSERT INTO notifications(recipient_email, subject, body, ta_assignment_id)
  VALUES (
    v_ta_email,
    'TA Assignment Update: ' || COALESCE(v_section_info, 'Unknown Section'),
    'Hello ' || COALESCE(v_ta_name, 'TA') || ',' || chr(10) ||
    'You have been assigned as TA for ' || COALESCE(v_section_info, 'a section') || '.' || chr(10) ||
    'Allocated hours: ' || COALESCE(NEW.hours::text, 'TBD'),
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ta_assignment_notify
  AFTER INSERT OR UPDATE ON ta_assignments
  FOR EACH ROW EXECUTE FUNCTION notify_ta_assignment();
