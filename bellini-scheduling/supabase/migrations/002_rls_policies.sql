-- ============================================================
-- 002_rls_policies.sql
-- Row Level Security policies for all tables
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE sections        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ta_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms           ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters       ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects        ENABLE ROW LEVEL SECURITY;

-- Helper: get role of the current authenticated user
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: get email of the current authenticated user
CREATE OR REPLACE FUNCTION current_user_email()
RETURNS TEXT AS $$
  SELECT email FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ================================================================
-- SECTIONS
-- ================================================================
CREATE POLICY sections_select ON sections
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY sections_insert ON sections
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'chair', 'ta_coordinator'));

CREATE POLICY sections_update ON sections
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'chair', 'ta_coordinator'))
  WITH CHECK (current_user_role() IN ('admin', 'chair', 'ta_coordinator'));

CREATE POLICY sections_delete ON sections
  FOR DELETE TO authenticated
  USING (current_user_role() IN ('admin', 'chair'));

-- ================================================================
-- TA_ASSIGNMENTS
-- ================================================================
-- TAs see only their own; coordinators/admins/chairs see all
CREATE POLICY ta_assignments_select ON ta_assignments
  FOR SELECT TO authenticated
  USING (
    current_user_role() IN ('admin', 'chair', 'ta_coordinator')
    OR EXISTS (
      SELECT 1 FROM tas t
      WHERE t.id = ta_assignments.ta_id
        AND t.email = current_user_email()
    )
  );

CREATE POLICY ta_assignments_insert ON ta_assignments
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'chair', 'ta_coordinator'));

CREATE POLICY ta_assignments_update ON ta_assignments
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'chair', 'ta_coordinator'))
  WITH CHECK (current_user_role() IN ('admin', 'chair', 'ta_coordinator'));

CREATE POLICY ta_assignments_delete ON ta_assignments
  FOR DELETE TO authenticated
  USING (current_user_role() IN ('admin', 'chair', 'ta_coordinator'));

-- ================================================================
-- USERS
-- ================================================================
CREATE POLICY users_select ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR current_user_role() IN ('admin', 'chair'));

CREATE POLICY users_insert ON users
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() = 'admin' OR id = auth.uid());

CREATE POLICY users_update ON users
  FOR UPDATE TO authenticated
  USING (current_user_role() = 'admin' OR id = auth.uid())
  WITH CHECK (current_user_role() = 'admin' OR id = auth.uid());

CREATE POLICY users_delete ON users
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ================================================================
-- AUDIT_LOG
-- ================================================================
CREATE POLICY audit_log_select ON audit_log
  FOR SELECT TO authenticated
  USING (current_user_role() IN ('admin', 'chair'));

-- Only triggers write to audit_log (SECURITY DEFINER functions bypass RLS)

-- ================================================================
-- NOTIFICATIONS
-- ================================================================
CREATE POLICY notifications_select ON notifications
  FOR SELECT TO authenticated
  USING (
    recipient_email = current_user_email()
    OR current_user_role() IN ('admin', 'chair', 'ta_coordinator')
  );

-- ================================================================
-- REFERENCE TABLES – Read access for all authenticated users
-- ================================================================

-- courses
CREATE POLICY courses_select ON courses FOR SELECT TO authenticated USING (true);
CREATE POLICY courses_write  ON courses FOR ALL    TO authenticated
  USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');

-- subjects
CREATE POLICY subjects_select ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY subjects_write  ON subjects FOR ALL    TO authenticated
  USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');

-- rooms
CREATE POLICY rooms_select ON rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY rooms_write  ON rooms FOR ALL    TO authenticated
  USING (current_user_role() IN ('admin', 'facilities')) WITH CHECK (current_user_role() IN ('admin', 'facilities'));

-- semesters
CREATE POLICY semesters_select ON semesters FOR SELECT TO authenticated USING (true);
CREATE POLICY semesters_write  ON semesters FOR ALL    TO authenticated
  USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');

-- campuses
CREATE POLICY campuses_select ON campuses FOR SELECT TO authenticated USING (true);
CREATE POLICY campuses_write  ON campuses FOR ALL    TO authenticated
  USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');

-- instructors
CREATE POLICY instructors_select ON instructors FOR SELECT TO authenticated USING (true);
CREATE POLICY instructors_write  ON instructors FOR ALL    TO authenticated
  USING (current_user_role() IN ('admin', 'chair')) WITH CHECK (current_user_role() IN ('admin', 'chair'));

-- tas
CREATE POLICY tas_select ON tas FOR SELECT TO authenticated USING (true);
CREATE POLICY tas_write  ON tas FOR ALL    TO authenticated
  USING (current_user_role() IN ('admin', 'chair', 'ta_coordinator'))
  WITH CHECK (current_user_role() IN ('admin', 'chair', 'ta_coordinator'));
