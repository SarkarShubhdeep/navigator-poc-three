-- ============================================
-- FIX WORK LOGS RLS FOR WORK LOG CREATION
-- ============================================
-- The issue: Work logs INSERT policy only checks project_members, but if project_members
-- is empty (due to RLS or failed insert), users can't create work logs.
-- Solution: Also allow project creators and team members to create work logs.

-- Drop existing policies (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view work logs in accessible tickets" ON work_logs;
DROP POLICY IF EXISTS "Users can create work logs in accessible tickets" ON work_logs;
DROP POLICY IF EXISTS "Users can update their own work logs" ON work_logs;
DROP POLICY IF EXISTS "Users can delete their own work logs" ON work_logs;

-- ============================================
-- WORK LOGS SELECT POLICY
-- ============================================
-- Users can view work logs if they have access to the ticket (via project or team membership)
CREATE POLICY "Users can view work logs in accessible tickets"
  ON work_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = work_logs.ticket_id
        AND (
          -- User is a project member
          EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = t.project_id
              AND pm.user_id = auth.uid()
          )
          OR
          -- User is a team member (of the team that owns the project)
          EXISTS (
            SELECT 1 FROM projects p
            JOIN team_members tm ON tm.team_id = p.team_id
            WHERE p.id = t.project_id
              AND tm.user_id = auth.uid()
          )
        )
    )
  );

-- ============================================
-- WORK LOGS INSERT POLICY
-- ============================================
-- Users can create work logs if:
-- 1. They own the work log (user_id = auth.uid())
-- 2. They have access to the ticket (via project or team membership)
-- 3. They have an active work session
CREATE POLICY "Users can create work logs in accessible tickets"
  ON work_logs FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = work_logs.ticket_id
        AND (
          -- User is a project member
          EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = t.project_id
              AND pm.user_id = auth.uid()
          )
          OR
          -- User is the project creator
          EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = t.project_id
              AND p.created_by = auth.uid()
          )
          OR
          -- User is a team member (of the team that owns the project)
          EXISTS (
            SELECT 1 FROM projects p
            JOIN team_members tm ON tm.team_id = p.team_id
            WHERE p.id = t.project_id
              AND tm.user_id = auth.uid()
          )
        )
    ) AND
    EXISTS (
      SELECT 1 FROM work_sessions
      WHERE id = work_logs.work_session_id
        AND user_id = auth.uid()
        AND is_active = true
    )
  );

-- ============================================
-- WORK LOGS UPDATE POLICY
-- ============================================
-- Users can update their own work logs
CREATE POLICY "Users can update their own work logs"
  ON work_logs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- WORK LOGS DELETE POLICY
-- ============================================
-- Users can delete their own work logs
CREATE POLICY "Users can delete their own work logs"
  ON work_logs FOR DELETE
  USING (user_id = auth.uid());

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'work_logs'
ORDER BY policyname;
