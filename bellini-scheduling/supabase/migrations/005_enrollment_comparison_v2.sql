-- ============================================================
-- 005_enrollment_comparison_v2.sql
-- Re-target enrollment_comparison view from S25/F25 to F25/S26.
-- Reason: the S25 source spreadsheet does not include enrollment
-- numbers (see scripts/import-s25.ts), so S25 columns are always
-- NULL. F25 and S26 both have real enrollment data.
-- ============================================================

DROP VIEW IF EXISTS enrollment_comparison;

CREATE OR REPLACE VIEW enrollment_comparison AS
WITH prior_data AS (
  SELECT s.course_id, SUM(s.enrollment) AS enrollment
  FROM sections s
  JOIN semesters sem ON sem.id = s.semester_id AND sem.code = 'F25'
  GROUP BY s.course_id
),
current_data AS (
  SELECT s.course_id, SUM(s.enrollment) AS enrollment
  FROM sections s
  JOIN semesters sem ON sem.id = s.semester_id AND sem.code = 'S26'
  GROUP BY s.course_id
)
SELECT
  c.id AS course_id,
  subj.code AS subject,
  c.course_number,
  c.title,
  'F25'::text AS prior_code,
  'S26'::text AS current_code,
  prior_d.enrollment AS prior_enrollment,
  current_d.enrollment AS current_enrollment,
  CASE
    WHEN prior_d.enrollment IS NOT NULL AND prior_d.enrollment > 0
    THEN ROUND(
      ((COALESCE(current_d.enrollment, 0) - prior_d.enrollment)::numeric / prior_d.enrollment) * 100,
      1
    )
    ELSE NULL
  END AS pct_change
FROM courses c
JOIN subjects subj ON subj.id = c.subject_id
LEFT JOIN prior_data prior_d ON prior_d.course_id = c.id
LEFT JOIN current_data current_d ON current_d.course_id = c.id
WHERE prior_d.enrollment IS NOT NULL OR current_d.enrollment IS NOT NULL
ORDER BY subj.code, c.course_number;
