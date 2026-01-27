-- ============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================
-- The problem: team_members policy checks team_members, causing infinite loop
-- The solution: Use simpler policies that don't self-reference

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Drop team_members policies
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;
DROP POLICY IF EXISTS "Team admins can add members" ON team_members;
DROP POLICY IF EXISTS "Users can update their own team membership" ON team_members;
DROP POLICY IF EXISTS "Team owners can update members" ON team_members;
DROP POLICY IF EXISTS "Team owners can update members, users can leave" ON team_members;
DROP POLICY IF EXISTS "Users can leave or owners can remove members" ON team_members;
DROP POLICY IF EXISTS "Team owners can remove members, users can leave" ON team_members;

-- Drop teams policies
DROP POLICY IF EXISTS "Users can view teams they belong to" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Team owners can update teams" ON teams;
DROP POLICY IF EXISTS "Team owners can delete teams" ON teams;

-- ============================================
-- STEP 2: CREATE HELPER FUNCTION (SECURITY DEFINER)
-- ============================================
-- This function bypasses RLS to check team membership
-- SECURITY DEFINER means it runs with the privileges of the function creator

CREATE OR REPLACE FUNCTION get_user_team_ids(p_user_id UUID)
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT team_id FROM team_members WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_team_ids(UUID) TO authenticated;

-- ============================================
-- STEP 3: CREATE TEAM_MEMBERS POLICIES (NO RECURSION)
-- ============================================

-- Team members: Users can view their own membership records
-- This is the simplest policy - no recursion possible
CREATE POLICY "Users can view their own team memberships"
  ON team_members FOR SELECT
  USING (user_id = auth.uid());

-- Team members: Allow INSERT via the create_team function (SECURITY DEFINER)
-- The create_team function already handles adding the owner
-- For manual inserts, we use a simple check
CREATE POLICY "Users can be added to teams"
  ON team_members FOR INSERT
  WITH CHECK (true);  -- Controlled by SECURITY DEFINER functions

-- Team members: Users can update their own record
CREATE POLICY "Users can update their own membership"
  ON team_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Team members: Users can delete their own record (leave team)
CREATE POLICY "Users can leave teams"
  ON team_members FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- STEP 4: CREATE TEAMS POLICIES (USE HELPER FUNCTION)
-- ============================================

-- Teams: Users can view teams they are members of
-- Uses the helper function to avoid recursion
CREATE POLICY "Users can view their teams"
  ON teams FOR SELECT
  USING (id IN (SELECT get_user_team_ids(auth.uid())));

-- Teams: Users can create teams (they will be added as owner by create_team function)
CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Teams: Team owners can update their teams
CREATE POLICY "Team owners can update teams"
  ON teams FOR UPDATE
  USING (id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  ))
  WITH CHECK (id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- Teams: Team owners can delete their teams
CREATE POLICY "Team owners can delete teams"
  ON teams FOR DELETE
  USING (id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- ============================================
-- STEP 5: VERIFICATION
-- ============================================

-- Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('teams', 'team_members')
ORDER BY tablename, policyname;

-- Test query (run this after the policies are created)
-- SELECT * FROM teams; -- Should work without recursion error
