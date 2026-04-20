-- Demo seed (forcing version): inject waitlist values into both F25 and S26
-- sections of 5 shared courses so waitlist_alerts view returns rows.
--
-- Use only for demo — not real data.
--
-- To revert:
--   UPDATE sections SET wait_list_actual = NULL
--   WHERE semester_id IN (SELECT id FROM semesters WHERE code IN ('F25','S26'));

WITH shared_courses AS (
  SELECT DISTINCT a.course_id, a.id AS f25_section_id, b.id AS s26_section_id,
         a.enrollment AS f25_enrollment, b.enrollment AS s26_enrollment
  FROM sections a
  JOIN semesters sa ON sa.id = a.semester_id
  JOIN sections b ON b.course_id = a.course_id
  JOIN semesters sb ON sb.id = b.semester_id
  WHERE sa.code = 'F25'
    AND sb.code = 'S26'
    AND a.enrollment > 10
    AND b.enrollment > 10
  LIMIT 5
),
updates AS (
  SELECT f25_section_id AS section_id,
         GREATEST(CEIL(f25_enrollment * 0.30)::int, 5) AS waitlist
  FROM shared_courses
  UNION ALL
  SELECT s26_section_id AS section_id,
         GREATEST(CEIL(s26_enrollment * 0.30)::int, 5) AS waitlist
  FROM shared_courses
)
UPDATE sections
SET wait_list_actual = updates.waitlist
FROM updates
WHERE sections.id = updates.section_id;

-- Should return 5 rows now
SELECT subject, course_number, course_title,
       section_b_id, waitlist_a, waitlist_pct_a, waitlist_b, waitlist_pct_b
FROM waitlist_alerts;
