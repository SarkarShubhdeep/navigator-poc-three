-- ============================================
-- FLUSH DATA FROM TEAMS AND TEAM_MEMBERS
-- ============================================
-- WARNING: This will delete ALL data from these tables
-- Run this only if you want to start fresh

-- Delete all team members first (due to foreign key constraint)
DELETE FROM team_members;

-- Delete all teams
DELETE FROM teams;

-- Verify tables are empty
SELECT COUNT(*) as team_members_count FROM team_members;
SELECT COUNT(*) as teams_count FROM teams;

-- ============================================
-- DROP EXISTING RLS POLICIES
-- ============================================
-- Drop existing policies to recreate them

DROP POLICY IF EXISTS "Users can view teams they belong to" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Team owners can update teams" ON teams;
DROP POLICY IF EXISTS "Team owners can delete teams" ON teams;

DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;
DROP POLICY IF EXISTS "Team admins can add members" ON team_members;
DROP POLICY IF EXISTS "Users can update their own team membership" ON team_members;
DROP POLICY IF EXISTS "Team owners can update members, users can leave" ON team_members;
DROP POLICY IF EXISTS "Team owners can remove members, users can leave" ON team_members;

-- ============================================
-- IMPROVED RLS POLICIES FOR TEAMS
-- ============================================

-- Teams: Users can view teams they are members of
-- This is simpler and more efficient - directly checks team_members table
CREATE POLICY "Users can view teams they belong to"
  ON teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
    )
  );

-- Teams: Users can create teams
CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Teams: Team owners can update their teams
CREATE POLICY "Team owners can update teams"
  ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'owner'
    )
  );

-- Teams: Team owners can delete their teams
CREATE POLICY "Team owners can delete teams"
  ON teams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'owner'
    )
  );

-- ============================================
-- IMPROVED RLS POLICIES FOR TEAM_MEMBERS
-- ============================================

-- Team members: Users can view their own memberships AND members of teams they belong to
-- This allows users to see their own record AND see other members of their teams
CREATE POLICY "Users can view team members of their teams"
  ON team_members FOR SELECT
  USING (
    -- User can see their own membership
    user_id = auth.uid()
    OR
    -- User can see members of teams they belong to
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
    )
  );

-- Team members: Team owners/admins can add members
CREATE POLICY "Team admins can add members"
  ON team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- Team members: Users can update their own membership
CREATE POLICY "Users can update their own team membership"
  ON team_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Team members: Team owners can update any member in their team
CREATE POLICY "Team owners can update members"
  ON team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  );

-- Team members: Users can remove themselves, owners can remove any member
CREATE POLICY "Users can leave or owners can remove members"
  ON team_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('teams', 'team_members');

-- Check all policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('teams', 'team_members')
ORDER BY tablename, policyname;
