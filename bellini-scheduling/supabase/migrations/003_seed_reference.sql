-- ============================================================
-- 003_seed_reference.sql
-- Seed reference data: semesters and campuses
-- ============================================================

-- Semesters
INSERT INTO semesters (code, term_label, term_code, start_date, end_date, is_active) VALUES
  ('S25', 'Spring 2025', '202501', '2025-01-06', '2025-04-25', true),
  ('F25', 'Fall 2025',   '202508', '2025-08-25', '2025-12-12', true),
  ('S26', 'Spring 2026', '202601', NULL,          NULL,          false)
ON CONFLICT (code) DO NOTHING;

-- Campuses
INSERT INTO campuses (code, name) VALUES
  ('MAIN',  'Main Campus'),
  ('TAMPA', 'Tampa Campus'),
  ('ONL',   'Online'),
  ('STPETE','St. Petersburg Campus'),
  ('SARA',  'Sarasota-Manatee Campus')
ON CONFLICT (code) DO NOTHING;
