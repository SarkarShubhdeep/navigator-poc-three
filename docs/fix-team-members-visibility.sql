-- ============================================
-- FIX: Users can see all members of their teams
-- ============================================
-- The issue: "Users can view their own team memberships" only lets you see your
-- own row in team_members. The app needs to show all team members (assign-to,
-- team drawer, ticket avatars). This policy uses get_user_team_ids so team
-- members can see everyone in their teams (no recursion).

-- Requires get_user_team_ids to exist (from fix-rls-recursion.sql)

DROP POLICY IF EXISTS "Users can view their own team memberships" ON team_members;

CREATE POLICY "Users can view members of their teams"
  ON team_members FOR SELECT
  USING (team_id IN (SELECT get_user_team_ids(auth.uid())));
