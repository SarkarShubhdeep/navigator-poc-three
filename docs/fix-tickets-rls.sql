-- ============================================
-- FIX TICKETS RLS FOR TICKET CREATION
-- ============================================
-- The issue: Tickets INSERT policy only checks project_members, but if project_members
-- is empty (due to RLS or failed insert), users can't create tickets.
-- Solution: Also allow project creators and team members to create tickets.

-- Drop existing policies (safe to run multiple times)
DROP POLICY IF EXISTS "Project members can create tickets" ON tickets;
DROP POLICY IF EXISTS "Project members can update tickets" ON tickets;
DROP POLICY IF EXISTS "Project members can delete tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view tickets in their projects" ON tickets;

-- ============================================
-- TICKETS SELECT POLICY
-- ============================================
-- Users can view tickets if they are:
-- 1. Project members, OR
-- 2. Team members (of the team that owns the project)
CREATE POLICY "Users can view tickets in their projects or teams"
  ON tickets FOR SELECT
  USING (
    -- Check if user is a project member
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tickets.project_id
        AND project_members.user_id = auth.uid()
    )
    OR
    -- Check if user is a team member (of the team that owns the project)
    EXISTS (
      SELECT 1 FROM projects
      JOIN team_members ON team_members.team_id = projects.team_id
      WHERE projects.id = tickets.project_id
        AND team_members.user_id = auth.uid()
    )
  );

-- ============================================
-- TICKETS INSERT POLICY
-- ============================================
-- Users can create tickets if they are:
-- 1. Project members, OR
-- 2. Project creators, OR
-- 3. Team members (of the team that owns the project)
CREATE POLICY "Project and team members can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    -- Check if user is a project member
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tickets.project_id
        AND project_members.user_id = auth.uid()
    )
    OR
    -- Check if user is the project creator
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
        AND projects.created_by = auth.uid()
    )
    OR
    -- Check if user is a team member (of the team that owns the project)
    EXISTS (
      SELECT 1 FROM projects
      JOIN team_members ON team_members.team_id = projects.team_id
      WHERE projects.id = tickets.project_id
        AND team_members.user_id = auth.uid()
    )
  );

-- ============================================
-- TICKETS UPDATE POLICY
-- ============================================
-- Users can update tickets if they are:
-- 1. Project members, OR
-- 2. Team members (of the team that owns the project)
CREATE POLICY "Project and team members can update tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tickets.project_id
        AND project_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM projects
      JOIN team_members ON team_members.team_id = projects.team_id
      WHERE projects.id = tickets.project_id
        AND team_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tickets.project_id
        AND project_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM projects
      JOIN team_members ON team_members.team_id = projects.team_id
      WHERE projects.id = tickets.project_id
        AND team_members.user_id = auth.uid()
    )
  );

-- ============================================
-- TICKETS DELETE POLICY
-- ============================================
-- Users can delete tickets if they are:
-- 1. Project members, OR
-- 2. Team members (of the team that owns the project)
CREATE POLICY "Project and team members can delete tickets"
  ON tickets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tickets.project_id
        AND project_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM projects
      JOIN team_members ON team_members.team_id = projects.team_id
      WHERE projects.id = tickets.project_id
        AND team_members.user_id = auth.uid()
    )
  );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tickets'
ORDER BY policyname;
