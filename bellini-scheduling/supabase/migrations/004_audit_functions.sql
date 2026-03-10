-- ============================================================
-- 004_audit_functions.sql
-- SQL functions and views for audit, reporting, and analytics
-- ============================================================

-- ============================================================
-- FUNCTION: get_duplicate_crns
-- Returns CRNs that appear more than once in the same semester.
-- ============================================================
CREATE OR REPLACE FUNCTION get_duplicate_crns(p_semester_id INT)
RETURNS TABLE(crn TEXT, section_count BIGINT, section_ids INT[]) AS $$
  SELECT
    s.crn,
    COUNT(*) AS section_count,
    ARRAY_AGG(s.id) AS section_ids
  FROM sections s
  WHERE s.semester_id = p_semester_id
  GROUP BY s.crn
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- FUNCTION: get_room_overlaps
-- Pairs of sections in the same room with overlapping time blocks.
-- ============================================================
CREATE OR REPLACE FUNCTION get_room_overlaps(p_semester_id INT)
RETURNS TABLE(
  section_a_id INT, section_a_crn TEXT, section_a_course TEXT,
  section_b_id INT, section_b_crn TEXT, section_b_course TEXT,
  room_code TEXT, overlap_days TEXT,
  time_a TEXT, time_b TEXT
) AS $$
  SELECT
    a.id, a.crn, concat(subj_a.code, ' ', c_a.course_number),
    b.id, b.crn, concat(subj_b.code, ' ', c_b.course_number),
    r.room_code, a.meeting_days,
    concat(a.meeting_time_start::text, '-', a.meeting_time_end::text),
    concat(b.meeting_time_start::text, '-', b.meeting_time_end::text)
  FROM sections a
  JOIN sections b ON (
    a.id < b.id
    AND a.room_id = b.room_id
    AND a.room_id IS NOT NULL
    AND a.semester_id = p_semester_id
    AND b.semester_id = p_semester_id
    AND a.meeting_days = b.meeting_days
    AND a.meeting_days IS NOT NULL
    AND a.meeting_time_start IS NOT NULL
    AND a.meeting_time_end IS NOT NULL
    AND b.meeting_time_start IS NOT NULL
    AND b.meeting_time_end IS NOT NULL
    AND a.meeting_time_start < b.meeting_time_end
    AND a.meeting_time_end > b.meeting_time_start
  )
  JOIN rooms r ON r.id = a.room_id
  JOIN courses c_a ON c_a.id = a.course_id
  JOIN subjects subj_a ON subj_a.id = c_a.subject_id
  JOIN courses c_b ON c_b.id = b.course_id
  JOIN subjects subj_b ON subj_b.id = c_b.subject_id
  ORDER BY r.room_code, a.meeting_days, a.meeting_time_start;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- FUNCTION: get_instructor_overlaps
-- Pairs of sections with the same instructor at overlapping times.
-- ============================================================
CREATE OR REPLACE FUNCTION get_instructor_overlaps(p_semester_id INT)
RETURNS TABLE(
  section_a_id INT, section_a_crn TEXT, section_a_course TEXT,
  section_b_id INT, section_b_crn TEXT, section_b_course TEXT,
  instructor_name TEXT, instructor_email TEXT,
  overlap_days TEXT, time_a TEXT, time_b TEXT
) AS $$
  SELECT
    a.id, a.crn, concat(subj_a.code, ' ', c_a.course_number),
    b.id, b.crn, concat(subj_b.code, ' ', c_b.course_number),
    i.full_name, i.email,
    a.meeting_days,
    concat(a.meeting_time_start::text, '-', a.meeting_time_end::text),
    concat(b.meeting_time_start::text, '-', b.meeting_time_end::text)
  FROM sections a
  JOIN sections b ON (
    a.id < b.id
    AND a.instructor_id = b.instructor_id
    AND a.instructor_id IS NOT NULL
    AND a.semester_id = p_semester_id
    AND b.semester_id = p_semester_id
    AND a.meeting_days = b.meeting_days
    AND a.meeting_days IS NOT NULL
    AND a.meeting_time_start IS NOT NULL
    AND a.meeting_time_end IS NOT NULL
    AND b.meeting_time_start IS NOT NULL
    AND b.meeting_time_end IS NOT NULL
    AND a.meeting_time_start < b.meeting_time_end
    AND a.meeting_time_end > b.meeting_time_start
  )
  JOIN instructors i ON i.id = a.instructor_id
  JOIN courses c_a ON c_a.id = a.course_id
  JOIN subjects subj_a ON subj_a.id = c_a.subject_id
  JOIN courses c_b ON c_b.id = b.course_id
  JOIN subjects subj_b ON subj_b.id = c_b.subject_id
  ORDER BY i.full_name, a.meeting_days, a.meeting_time_start;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- VIEW: section_ta_ratios
-- TA hours-per-enrolled-student per section.
-- Threshold: 0.1 hours per student (configurable in app).
-- ============================================================
CREATE OR REPLACE VIEW section_ta_ratios AS
SELECT
  s.id AS section_id,
  s.semester_id,
  s.crn,
  s.section_code,
  subj.code AS subject,
  c.course_number,
  c.title AS course_title,
  s.enrollment,
  COALESCE(SUM(ta.hours), 0) AS total_ta_hours,
  CASE
    WHEN s.enrollment > 0
    THEN ROUND(COALESCE(SUM(ta.hours), 0) / s.enrollment, 4)
    ELSE NULL
  END AS hours_per_student,
  CASE
    WHEN s.enrollment > 0
      AND COALESCE(SUM(ta.hours), 0) / s.enrollment < 0.1
    THEN true
    ELSE false
  END AS below_threshold
FROM sections s
JOIN courses c ON c.id = s.course_id
JOIN subjects subj ON subj.id = c.subject_id
LEFT JOIN ta_assignments ta ON ta.section_id = s.id
GROUP BY s.id, s.semester_id, s.crn, s.section_code, subj.code, c.course_number, c.title, s.enrollment;

-- ============================================================
-- VIEW: enrollment_comparison
-- Side-by-side S25 vs F25 enrollment per course with % change.
-- ============================================================
CREATE OR REPLACE VIEW enrollment_comparison AS
WITH s25_data AS (
  SELECT s.course_id, SUM(s.enrollment) AS enrollment
  FROM sections s
  JOIN semesters sem ON sem.id = s.semester_id AND sem.code = 'S25'
  GROUP BY s.course_id
),
f25_data AS (
  SELECT s.course_id, SUM(s.enrollment) AS enrollment
  FROM sections s
  JOIN semesters sem ON sem.id = s.semester_id AND sem.code = 'F25'
  GROUP BY s.course_id
)
SELECT
  c.id AS course_id,
  subj.code AS subject,
  c.course_number,
  c.title,
  s25.enrollment AS s25_enrollment,
  f25.enrollment AS f25_enrollment,
  CASE
    WHEN s25.enrollment IS NOT NULL AND s25.enrollment > 0
    THEN ROUND(
      ((COALESCE(f25.enrollment, 0) - s25.enrollment)::numeric / s25.enrollment) * 100,
      1
    )
    ELSE NULL
  END AS pct_change
FROM courses c
JOIN subjects subj ON subj.id = c.subject_id
LEFT JOIN s25_data s25 ON s25.course_id = c.id
LEFT JOIN f25_data f25 ON f25.course_id = c.id
WHERE s25.enrollment IS NOT NULL OR f25.enrollment IS NOT NULL
ORDER BY subj.code, c.course_number;

-- ============================================================
-- VIEW: instructor_workload
-- Cross-semester workload aggregation per instructor.
-- ============================================================
CREATE OR REPLACE VIEW instructor_workload AS
SELECT
  i.id AS instructor_id,
  i.full_name,
  i.email,
  sem.id AS semester_id,
  sem.code AS semester,
  sem.term_label,
  COUNT(s.id) AS total_sections,
  COALESCE(SUM(s.enrollment), 0) AS total_enrolled,
  COALESCE(SUM(ta_agg.total_ta_hours), 0) AS total_ta_hours_supervised
FROM instructors i
JOIN sections s ON s.instructor_id = i.id
JOIN semesters sem ON sem.id = s.semester_id
LEFT JOIN (
  SELECT section_id, SUM(hours) AS total_ta_hours
  FROM ta_assignments
  GROUP BY section_id
) ta_agg ON ta_agg.section_id = s.id
GROUP BY i.id, i.full_name, i.email, sem.id, sem.code, sem.term_label
ORDER BY i.full_name, sem.id;

-- ============================================================
-- VIEW: waitlist_alerts
-- Courses where waitlist > 20% of enrollment across two consecutive semesters.
-- ============================================================
CREATE OR REPLACE VIEW waitlist_alerts AS
SELECT
  c.id AS course_id,
  subj.code AS subject,
  c.course_number,
  c.title AS course_title,
  a.id AS section_a_id, a.crn AS crn_a,
  a_sem.code AS semester_a, a_sem.id AS semester_a_id,
  a.enrollment AS enrollment_a, a.wait_list_actual AS waitlist_a,
  ROUND((a.wait_list_actual::numeric / NULLIF(a.enrollment, 0)) * 100, 1) AS waitlist_pct_a,
  b.id AS section_b_id, b.crn AS crn_b,
  b_sem.code AS semester_b, b_sem.id AS semester_b_id,
  b.enrollment AS enrollment_b, b.wait_list_actual AS waitlist_b,
  ROUND((b.wait_list_actual::numeric / NULLIF(b.enrollment, 0)) * 100, 1) AS waitlist_pct_b
FROM sections a
JOIN sections b ON (
  b.course_id = a.course_id
  AND b.semester_id > a.semester_id
)
JOIN courses c ON c.id = a.course_id
JOIN subjects subj ON subj.id = c.subject_id
JOIN semesters a_sem ON a_sem.id = a.semester_id
JOIN semesters b_sem ON b_sem.id = b.semester_id
WHERE
  a.enrollment > 0
  AND b.enrollment > 0
  AND a.wait_list_actual IS NOT NULL
  AND b.wait_list_actual IS NOT NULL
  AND (a.wait_list_actual::float / a.enrollment) > 0.2
  AND (b.wait_list_actual::float / b.enrollment) > 0.2
ORDER BY c.id, a_sem.id;
