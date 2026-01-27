-- ============================================
-- FIX PROJECT MEMBER RLS FOR PROJECT CREATION
-- ============================================
-- The issue: Project owners can add members, but we need to add the first member
-- when creating a project. This creates a chicken-and-egg problem.
-- Solution: Allow project creators to add themselves as the first member.

-- Drop the existing policies (safe to run multiple times)
DROP POLICY IF EXISTS "Project owners can add members" ON project_members;
DROP POLICY IF EXISTS "Project creators and owners can add members" ON project_members;

-- Create a new policy that allows:
-- 1. Project creators to add themselves (if they created the project)
-- 2. Existing project owners to add other members
CREATE POLICY "Project creators and owners can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    -- Allow if user is the project creator (checking projects.created_by)
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
        AND projects.created_by = auth.uid()
    )
    OR
    -- Allow if user is already a project owner
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
    )
  );

-- ============================================
-- FIX PROJECT MEMBERS SELECT POLICY (RECURSION ISSUE)
-- ============================================
-- The SELECT policy has a circular dependency - it checks project_members
-- from within project_members. We need to fix this.

-- Drop the existing SELECT policies (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view project members of their projects" ON project_members;
DROP POLICY IF EXISTS "Users can view project members of their teams' projects" ON project_members;

-- Create a new SELECT policy that checks team membership instead
-- This avoids recursion and allows users to see members of projects in their teams
CREATE POLICY "Users can view project members of their teams' projects"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN team_members ON team_members.team_id = projects.team_id
      WHERE projects.id = project_members.project_id
        AND team_members.user_id = auth.uid()
    )
  );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'project_members'
ORDER BY policyname;
