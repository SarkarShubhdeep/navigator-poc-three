# Supabase Backend Setup Guide

This guide provides step-by-step instructions for implementing the Navigator application backend in Supabase, based on the schema defined in `project-schema.md`.

## Prerequisites

- Supabase project created
- Access to Supabase Dashboard (SQL Editor)
- Environment variables configured:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

---

## Step 1: Create Custom Types (ENUMs)

Create the custom types/enums that will be used across multiple tables.

### 1.1 Create Ticket Status Enum

```sql
-- Create ticket_status enum
CREATE TYPE ticket_status AS ENUM ('open', 'active', 'close');
```

### 1.2 Create Ticket Priority Enum

```sql
-- Create ticket_priority enum
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
```

### 1.3 Create Team Member Role Enum

```sql
-- Create team_member_role enum
CREATE TYPE team_member_role AS ENUM ('owner', 'admin', 'member');
```

### 1.4 Create Project Member Role Enum

```sql
-- Create project_member_role enum
CREATE TYPE project_member_role AS ENUM ('owner', 'member', 'viewer');
```

**Verification:**

```sql
-- Check all enums were created
SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;
```

---

## Step 2: Create Core Tables

### 2.1 Create Teams Table

```sql
-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  invite_code VARCHAR(6) NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX idx_teams_invite_code ON teams(invite_code);
CREATE INDEX idx_teams_created_by ON teams(created_by);

-- Add comment
COMMENT ON TABLE teams IS 'Teams represent workspaces/organizations that contain projects';
```

### 2.2 Create Team Members Table

```sql
-- Create team_members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  full_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  CONSTRAINT unique_team_member UNIQUE (team_id, user_id)
);

-- Create indexes
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- Add comment
COMMENT ON TABLE team_members IS 'Junction table for team membership with denormalized user data';
```

### 2.3 Create Projects Table

```sql
-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_projects_team_id ON projects(team_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);

-- Add comment
COMMENT ON TABLE projects IS 'Projects belong to teams and contain tickets';
```

### 2.4 Create Project Members Table

```sql
-- Create project_members table
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role project_member_role NOT NULL DEFAULT 'member',
  is_online BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  full_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  CONSTRAINT unique_project_member UNIQUE (project_id, user_id)
);

-- Create indexes
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_is_online ON project_members(is_online);

-- Add comment
COMMENT ON TABLE project_members IS 'Junction table for project membership with online status';
```

### 2.5 Create Work Sessions Table

```sql
-- Create work_sessions table
CREATE TABLE work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  clock_out_time TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER, -- Duration in seconds
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX idx_work_sessions_is_active ON work_sessions(is_active);
CREATE INDEX idx_work_sessions_clock_in_time ON work_sessions(clock_in_time);
CREATE INDEX idx_work_sessions_project_id ON work_sessions(project_id);
CREATE INDEX idx_work_sessions_user_active ON work_sessions(user_id, is_active);

-- Create unique partial index to ensure only one active session per user
CREATE UNIQUE INDEX idx_one_active_session_per_user
ON work_sessions (user_id)
WHERE is_active = true;

-- Add constraint: clock_out_time must be after clock_in_time
ALTER TABLE work_sessions
ADD CONSTRAINT check_clock_times
CHECK (clock_out_time IS NULL OR clock_out_time > clock_in_time);

-- Add comment
COMMENT ON TABLE work_sessions IS 'Tracks user clock in/out sessions. Users must be clocked in to work on tickets';
```

### 2.6 Create Tickets Table

```sql
-- Create tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  assigned_to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_worked_on TIMESTAMP WITH TIME ZONE, -- Denormalized from work_logs
  total_duration INTEGER NOT NULL DEFAULT 0, -- Denormalized sum of work_logs.duration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tickets_project_id ON tickets(project_id);
CREATE INDEX idx_tickets_assigned_to_user_id ON tickets(assigned_to_user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_last_worked_on ON tickets(last_worked_on);
CREATE INDEX idx_tickets_project_status ON tickets(project_id, status);

-- Add comment
COMMENT ON TABLE tickets IS 'Work tickets that team members can work on';
```

### 2.7 Create Work Logs Table

```sql
-- Create work_logs table
CREATE TABLE work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- Duration in seconds
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_work_logs_ticket_id ON work_logs(ticket_id);
CREATE INDEX idx_work_logs_user_id ON work_logs(user_id);
CREATE INDEX idx_work_logs_work_session_id ON work_logs(work_session_id);
CREATE INDEX idx_work_logs_start_time ON work_logs(start_time);
CREATE INDEX idx_work_logs_ticket_start ON work_logs(ticket_id, start_time);
CREATE INDEX idx_work_logs_session_start ON work_logs(work_session_id, start_time);

-- Add constraints
ALTER TABLE work_logs
ADD CONSTRAINT check_end_after_start
CHECK (end_time > start_time);

ALTER TABLE work_logs
ADD CONSTRAINT check_duration_match
CHECK (duration = EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER);

-- Add comment
COMMENT ON TABLE work_logs IS 'Individual work sessions on tickets. Must be created during active work_session';
```

**Verification:**

```sql
-- Check all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

---

## Step 3: Create Helper Functions

### 3.1 Create Invite Code Generation Function

```sql
-- Function to generate unique 6-character invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code VARCHAR(6);
  exists_check BOOLEAN;
  attempts INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Generate random 6-character code
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM teams WHERE invite_code = code) INTO exists_check;

    -- If code doesn't exist, return it
    IF NOT exists_check THEN
      RETURN code;
    END IF;

    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique invite code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION generate_invite_code() IS 'Generates a unique 6-character alphanumeric invite code for teams';
```

### 3.2 Create Function to Update Updated_at Timestamp

```sql
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp';
```

---

## Step 4: Create Triggers

### 4.1 Create Updated_at Triggers

Apply the `update_updated_at_column()` function to all tables with `updated_at`:

```sql
-- Teams table
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Projects table
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tickets table
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Work sessions table
CREATE TRIGGER update_work_sessions_updated_at
  BEFORE UPDATE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Work logs table
CREATE TRIGGER update_work_logs_updated_at
  BEFORE UPDATE ON work_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 Create Ticket Duration Update Trigger

```sql
-- Function to update ticket total_duration and last_worked_on
CREATE OR REPLACE FUNCTION update_ticket_duration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tickets
  SET
    total_duration = (
      SELECT COALESCE(SUM(duration), 0)
      FROM work_logs
      WHERE ticket_id = COALESCE(NEW.ticket_id, OLD.ticket_id)
    ),
    last_worked_on = (
      SELECT MAX(end_time)
      FROM work_logs
      WHERE ticket_id = COALESCE(NEW.ticket_id, OLD.ticket_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.ticket_id, OLD.ticket_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER work_log_duration_update
  AFTER INSERT OR UPDATE OR DELETE ON work_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_duration();

-- Add comment
COMMENT ON FUNCTION update_ticket_duration() IS 'Automatically updates ticket total_duration and last_worked_on when work logs change';
```

### 4.3 Create Work Log Session Validation Trigger

```sql
-- Function to validate work log belongs to active work session
CREATE OR REPLACE FUNCTION validate_work_log_session()
RETURNS TRIGGER AS $$
DECLARE
  session_record work_sessions%ROWTYPE;
BEGIN
  -- Get the work session
  SELECT * INTO session_record
  FROM work_sessions
  WHERE id = NEW.work_session_id;

  -- Validate session exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work session not found: %', NEW.work_session_id;
  END IF;

  -- Validate session is active (for new work logs)
  IF TG_OP = 'INSERT' AND NOT session_record.is_active THEN
    RAISE EXCEPTION 'Cannot create work log for inactive work session';
  END IF;

  -- Validate time bounds
  IF NEW.start_time < session_record.clock_in_time THEN
    RAISE EXCEPTION 'Work log start time must be after session clock in time';
  END IF;

  IF session_record.clock_out_time IS NOT NULL AND NEW.end_time > session_record.clock_out_time THEN
    RAISE EXCEPTION 'Work log end time must be before session clock out time';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER work_log_session_validation
  BEFORE INSERT OR UPDATE ON work_logs
  FOR EACH ROW
  EXECUTE FUNCTION validate_work_log_session();

-- Add comment
COMMENT ON FUNCTION validate_work_log_session() IS 'Validates that work logs are created during active work sessions and within time bounds';
```

### 4.4 Create Function to Sync User Data to Team/Project Members

```sql
-- Function to sync user full_name and email to team_members
CREATE OR REPLACE FUNCTION sync_user_to_team_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Update team_members when user metadata changes
  UPDATE team_members
  SET
    full_name = NEW.raw_user_meta_data->>'full_name',
    email = NEW.email
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync user full_name and email to project_members
CREATE OR REPLACE FUNCTION sync_user_to_project_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Update project_members when user metadata changes
  UPDATE project_members
  SET
    full_name = NEW.raw_user_meta_data->>'full_name',
    email = NEW.email
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: These triggers need to be created on auth.users table
-- This requires superuser access or using Supabase Edge Functions
-- Alternative: Handle this in application code when user updates their profile
```

**Verification:**

```sql
-- Check all triggers were created
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

---

## Step 5: Create Row Level Security (RLS) Policies

Enable RLS on all tables and create policies for secure access.

### 5.1 Enable RLS on All Tables

```sql
-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
```

### 5.2 Teams Table Policies

```sql
-- Teams: Users can view teams they are members of
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

-- Teams: Owners can update their teams
CREATE POLICY "Team owners can update teams"
  ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'owner'
    )
  );

-- Teams: Owners can delete their teams
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
```

### 5.3 Team Members Table Policies

```sql
-- Team members: Users can view members of teams they belong to
CREATE POLICY "Users can view team members of their teams"
  ON team_members FOR SELECT
  USING (
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
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_members.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('owner', 'admin')
    )
  );

-- Team members: Users can update their own membership (limited fields)
CREATE POLICY "Users can update their own team membership"
  ON team_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Team members: Owners can update any member, users can leave
CREATE POLICY "Team owners can update members, users can leave"
  ON team_members FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  );

-- Team members: Owners can remove members, users can remove themselves
CREATE POLICY "Team owners can remove members, users can leave"
  ON team_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  );
```

### 5.4 Projects Table Policies

```sql
-- Projects: Users can view projects of teams they belong to
CREATE POLICY "Users can view projects of their teams"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = projects.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- Projects: Team members can create projects
CREATE POLICY "Team members can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = projects.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- Projects: Project members can update projects
CREATE POLICY "Project members can update projects"
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
    )
  );

-- Projects: Project owners can delete projects
CREATE POLICY "Project owners can delete projects"
  ON projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
        AND project_members.role = 'owner'
    )
  );
```

### 5.5 Project Members Table Policies

```sql
-- Project members: Users can view members of projects they belong to
CREATE POLICY "Users can view project members of their projects"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Project members: Project owners can add members
CREATE POLICY "Project owners can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
    )
  );

-- Project members: Users can update their own record
-- Note: Column-level restrictions (e.g., only is_online) should be enforced in application logic or triggers
CREATE POLICY "Users can update their own project membership"
  ON project_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Project members: Project owners can update any member
CREATE POLICY "Project owners can update members"
  ON project_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
    )
  );

-- Project members: Project owners can remove members, users can remove themselves
CREATE POLICY "Project owners can remove members, users can leave"
  ON project_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
    )
  );
```

### 5.6 Work Sessions Table Policies

```sql
-- Work sessions: Users can view their own work sessions
CREATE POLICY "Users can view their own work sessions"
  ON work_sessions FOR SELECT
  USING (user_id = auth.uid());

-- Work sessions: Users can create their own work sessions
CREATE POLICY "Users can create their own work sessions"
  ON work_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Work sessions: Users can update their own work sessions
CREATE POLICY "Users can update their own work sessions"
  ON work_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Work sessions: Users can delete their own work sessions
CREATE POLICY "Users can delete their own work sessions"
  ON work_sessions FOR DELETE
  USING (user_id = auth.uid());
```

### 5.7 Tickets Table Policies

```sql
-- Tickets: Users can view tickets in projects they belong to
CREATE POLICY "Users can view tickets in their projects"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tickets.project_id
        AND project_members.user_id = auth.uid()
    )
  );

-- Tickets: Project members can create tickets
CREATE POLICY "Project members can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tickets.project_id
        AND project_members.user_id = auth.uid()
    )
  );

-- Tickets: Project members can update tickets
CREATE POLICY "Project members can update tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tickets.project_id
        AND project_members.user_id = auth.uid()
    )
  );

-- Tickets: Project members can delete tickets
CREATE POLICY "Project members can delete tickets"
  ON tickets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tickets.project_id
        AND project_members.user_id = auth.uid()
    )
  );
```

### 5.8 Work Logs Table Policies

```sql
-- Work logs: Users can view work logs in tickets they have access to
CREATE POLICY "Users can view work logs in accessible tickets"
  ON work_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id = work_logs.ticket_id
        AND pm.user_id = auth.uid()
    )
  );

-- Work logs: Users can create work logs for tickets they have access to
CREATE POLICY "Users can create work logs in accessible tickets"
  ON work_logs FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id = work_logs.ticket_id
        AND pm.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM work_sessions
      WHERE id = work_logs.work_session_id
        AND user_id = auth.uid()
        AND is_active = true
    )
  );

-- Work logs: Users can update their own work logs
CREATE POLICY "Users can update their own work logs"
  ON work_logs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Work logs: Users can delete their own work logs
CREATE POLICY "Users can delete their own work logs"
  ON work_logs FOR DELETE
  USING (user_id = auth.uid());
```

**Verification:**

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('teams', 'team_members', 'projects', 'project_members', 'work_sessions', 'tickets', 'work_logs');

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Step 6: Create Database Functions for Business Logic

### 6.1 Create Function to Clock In (Start Work Session)

```sql
-- Function to clock in (start work session)
CREATE OR REPLACE FUNCTION clock_in(p_project_id UUID DEFAULT NULL)
RETURNS work_sessions AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session_id UUID;
  v_result work_sessions;
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Clock out any existing active session
  UPDATE work_sessions
  SET
    clock_out_time = NOW(),
    total_duration = EXTRACT(EPOCH FROM (NOW() - clock_in_time))::INTEGER,
    is_active = false,
    updated_at = NOW()
  WHERE user_id = v_user_id AND is_active = true;

  -- Create new active session
  INSERT INTO work_sessions (
    user_id,
    project_id,
    clock_in_time,
    clock_out_time,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_project_id,
    NOW(),
    NULL,
    true,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION clock_in(UUID) IS 'Clocks in user, automatically clocks out any existing active session';
```

### 6.2 Create Function to Clock Out (End Work Session)

```sql
-- Function to clock out (end work session)
CREATE OR REPLACE FUNCTION clock_out()
RETURNS work_sessions AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result work_sessions;
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Find and clock out active session
  UPDATE work_sessions
  SET
    clock_out_time = NOW(),
    total_duration = EXTRACT(EPOCH FROM (NOW() - clock_in_time))::INTEGER,
    is_active = false,
    updated_at = NOW()
  WHERE user_id = v_user_id AND is_active = true
  RETURNING * INTO v_result;

  IF v_result.id IS NULL THEN
    RAISE EXCEPTION 'No active work session found';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION clock_out() IS 'Clocks out user from their active work session';
```

### 6.3 Create Function to Get Active Work Session

```sql
-- Function to get user's active work session with elapsed time
CREATE OR REPLACE FUNCTION get_active_work_session()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  project_id UUID,
  clock_in_time TIMESTAMP WITH TIME ZONE,
  clock_out_time TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER,
  is_active BOOLEAN,
  elapsed_seconds INTEGER
) AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  RETURN QUERY
  SELECT
    ws.id,
    ws.user_id,
    ws.project_id,
    ws.clock_in_time,
    ws.clock_out_time,
    ws.total_duration,
    ws.is_active,
    EXTRACT(EPOCH FROM (NOW() - ws.clock_in_time))::INTEGER as elapsed_seconds
  FROM work_sessions ws
  WHERE ws.user_id = v_user_id AND ws.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION get_active_work_session() IS 'Returns user active work session with calculated elapsed time';
```

### 6.4 Create Function to Create Team with Invite Code

```sql
-- Function to create team with auto-generated invite code
CREATE OR REPLACE FUNCTION create_team(p_name VARCHAR(255))
RETURNS teams AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_invite_code VARCHAR(6);
  v_team_id UUID;
  v_result teams;
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Generate unique invite code
  v_invite_code := generate_invite_code();

  -- Create team
  INSERT INTO teams (name, invite_code, created_by, created_at, updated_at)
  VALUES (p_name, v_invite_code, v_user_id, NOW(), NOW())
  RETURNING id INTO v_team_id;

  -- Add creator as owner
  INSERT INTO team_members (team_id, user_id, role, joined_at, full_name, email)
  VALUES (
    v_team_id,
    v_user_id,
    'owner',
    NOW(),
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = v_user_id),
    (SELECT email FROM auth.users WHERE id = v_user_id)
  );

  -- Return created team
  SELECT * INTO v_result FROM teams WHERE id = v_team_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION create_team(VARCHAR) IS 'Creates a new team with auto-generated invite code and adds creator as owner';
```

### 6.5 Create Function to Join Team by Invite Code

```sql
-- Function to join team by invite code
CREATE OR REPLACE FUNCTION join_team_by_code(p_invite_code VARCHAR(6))
RETURNS teams AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_normalized_code VARCHAR(6);
  v_team_id UUID;
  v_result teams;
  v_existing_member BOOLEAN;
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Normalize invite code (uppercase, alphanumeric only)
  v_normalized_code := UPPER(REGEXP_REPLACE(p_invite_code, '[^A-Z0-9]', '', 'g'));

  IF LENGTH(v_normalized_code) != 6 THEN
    RAISE EXCEPTION 'Invalid invite code format. Must be 6 alphanumeric characters';
  END IF;

  -- Find team by invite code
  SELECT id INTO v_team_id
  FROM teams
  WHERE invite_code = v_normalized_code
  FOR UPDATE;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Team not found with invite code: %', v_normalized_code;
  END IF;

  -- Check if user is already a member
  SELECT EXISTS(
    SELECT 1 FROM team_members
    WHERE team_id = v_team_id AND user_id = v_user_id
  ) INTO v_existing_member;

  IF v_existing_member THEN
    RAISE EXCEPTION 'User is already a member of this team';
  END IF;

  -- Add user as member
  INSERT INTO team_members (team_id, user_id, role, joined_at, full_name, email)
  VALUES (
    v_team_id,
    v_user_id,
    'member',
    NOW(),
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = v_user_id),
    (SELECT email FROM auth.users WHERE id = v_user_id)
  );

  -- Return team
  SELECT * INTO v_result FROM teams WHERE id = v_team_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION join_team_by_code(VARCHAR) IS 'Joins user to team using invite code, validates code and prevents duplicate memberships';
```

**Verification:**

```sql
-- Check all functions were created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

---

## Step 7: Set Up Real-time Subscriptions (Optional)

Enable real-time for tables that need live updates.

### 7.1 Enable Real-time on Tables

In Supabase Dashboard → Database → Replication:

- Enable replication for `project_members` (for online status)
- Enable replication for `work_sessions` (for active session status)
- Enable replication for `tickets` (for status changes)
- Enable replication for `work_logs` (for live updates)

Or via SQL:

```sql
-- Enable real-time replication
ALTER PUBLICATION supabase_realtime ADD TABLE project_members;
ALTER PUBLICATION supabase_realtime ADD TABLE work_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE work_logs;
```

---

## Step 8: Create Views for Common Queries (Optional)

### 8.1 Create View for Project with Members and Tickets

```sql
-- View for project details with aggregated members and tickets
CREATE OR REPLACE VIEW project_details AS
SELECT
  p.id,
  p.name,
  p.team_id,
  p.description,
  p.created_by,
  p.created_at,
  p.updated_at,
  json_agg(DISTINCT jsonb_build_object(
    'id', pm.id,
    'userId', pm.user_id,
    'fullName', pm.full_name,
    'email', pm.email,
    'role', pm.role,
    'isOnline', pm.is_online,
    'joinedAt', pm.joined_at
  )) FILTER (WHERE pm.id IS NOT NULL) as members,
  json_agg(DISTINCT jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'status', t.status,
    'priority', t.priority,
    'assignedToUserId', t.assigned_to_user_id,
    'totalDuration', t.total_duration,
    'lastWorkedOn', t.last_worked_on,
    'createdAt', t.created_at
  )) FILTER (WHERE t.id IS NOT NULL) as tickets
FROM projects p
LEFT JOIN project_members pm ON pm.project_id = p.id
LEFT JOIN tickets t ON t.project_id = p.id
GROUP BY p.id;

-- Grant access
GRANT SELECT ON project_details TO authenticated;
```

### 8.2 Create View for Ticket with Work History

```sql
-- View for ticket details with work logs
CREATE OR REPLACE VIEW ticket_details AS
SELECT
  t.*,
  json_agg(
    jsonb_build_object(
      'id', wl.id,
      'userId', wl.user_id,
      'workSessionId', wl.work_session_id,
      'startTime', wl.start_time,
      'endTime', wl.end_time,
      'duration', wl.duration,
      'description', wl.description,
      'createdAt', wl.created_at
    ) ORDER BY wl.start_time DESC
  ) FILTER (WHERE wl.id IS NOT NULL) as work_logs
FROM tickets t
LEFT JOIN work_logs wl ON wl.ticket_id = t.id
GROUP BY t.id;

-- Grant access
GRANT SELECT ON ticket_details TO authenticated;
```

---

## Step 9: Test the Setup

### 9.1 Test Team Creation

```sql
-- Test creating a team (run as authenticated user)
SELECT create_team('Test Team');
```

### 9.2 Test Team Joining

```sql
-- Get invite code from created team
SELECT invite_code FROM teams WHERE name = 'Test Team';

-- Test joining team (run as different authenticated user)
SELECT join_team_by_code('XXXXXX'); -- Replace with actual invite code
```

### 9.3 Test Work Session

```sql
-- Test clocking in
SELECT clock_in(NULL); -- Global session
SELECT clock_in('project-id-here'); -- Project-specific session

-- Test getting active session
SELECT * FROM get_active_work_session();

-- Test clocking out
SELECT clock_out();
```

### 9.4 Test Ticket and Work Log Creation

```sql
-- Create a test project first (requires team)
-- Then create a ticket
-- Then clock in
-- Then create work log
```

---

## Step 10: Create Indexes for Performance

Additional indexes for common query patterns:

```sql
-- Composite indexes for filtered queries
CREATE INDEX idx_tickets_project_status_created ON tickets(project_id, status, created_at DESC);
CREATE INDEX idx_work_logs_ticket_user_start ON work_logs(ticket_id, user_id, start_time DESC);
CREATE INDEX idx_work_sessions_user_clock_in ON work_sessions(user_id, clock_in_time DESC);

-- Full-text search indexes (if needed)
CREATE INDEX idx_tickets_title_search ON tickets USING gin(to_tsvector('english', title));
CREATE INDEX idx_tickets_description_search ON tickets USING gin(to_tsvector('english', description));
```

---

## Step 11: Set Up Database Webhooks (Optional) - PENDING

For notifications or external integrations:

1. Go to Supabase Dashboard → Database → Webhooks
2. Create webhooks for:
    - Team creation
    - Team member joins
    - Ticket status changes
    - Work session clock in/out

---

## Step 12: Verify Everything Works

### 12.1 Check All Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected tables:

- teams
- team_members
- projects
- project_members
- work_sessions
- tickets
- work_logs

### 12.2 Check All Enums Exist

```sql
SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;
```

Expected enums:

- ticket_status
- ticket_priority
- team_member_role
- project_member_role

### 12.3 Check All Functions Exist

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

Expected functions:

- clock_in
- clock_out
- create_team
- generate_invite_code
- get_active_work_session
- join_team_by_code
- sync_user_to_project_member
- sync_user_to_team_member
- update_ticket_duration
- update_updated_at_column
- validate_work_log_session

### 12.4 Check All Triggers Exist

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### 12.5 Check RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

---

## Step 13: Migration Script

Create a single migration script that can be run in order:

```sql
-- Save this as: supabase/migrations/YYYYMMDDHHMMSS_initial_schema.sql

-- Step 1: Create enums
-- Step 2: Create tables
-- Step 3: Create functions
-- Step 4: Create triggers
-- Step 5: Enable RLS
-- Step 6: Create policies
-- Step 7: Create views (optional)
-- Step 8: Create additional indexes
```

---

## Step 14: Application Integration Notes

### 14.1 Environment Variables

Ensure these are set in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 14.2 API Route Structure

Create Next.js API routes in `app/api/`:

- `app/api/teams/route.ts`
- `app/api/teams/[id]/route.ts`
- `app/api/teams/join/route.ts`
- `app/api/projects/route.ts`
- `app/api/projects/[id]/route.ts`
- `app/api/work-sessions/clock-in/route.ts`
- `app/api/work-sessions/clock-out/route.ts`
- `app/api/work-sessions/active/route.ts`
- `app/api/tickets/route.ts`
- `app/api/tickets/[id]/route.ts`
- `app/api/tickets/[id]/start/route.ts`
- `app/api/tickets/[id]/pause/route.ts`

### 14.3 Client-Side Usage

Example queries using Supabase client:

```typescript
// Get user's teams
const { data: teams } = await supabase
    .from("teams")
    .select("*, team_members(*)")
    .order("created_at", { ascending: false });

// Get project with members and tickets
const { data: project } = await supabase
    .from("projects")
    .select("*, project_members(*), tickets(*)")
    .eq("id", projectId)
    .single();

// Clock in
const { data: session } = await supabase.rpc("clock_in", {
    p_project_id: projectId,
});

// Get active session
const { data: activeSession } = await supabase.rpc("get_active_work_session");
```

---

## Troubleshooting

### Common Issues

1. **RLS blocking queries**: Check policies are correctly set up
2. **Function permissions**: Use `SECURITY DEFINER` for functions that need elevated permissions
3. **Trigger errors**: Check trigger functions handle NULL values correctly
4. **Unique constraint violations**: Ensure invite code generation is truly unique

### Testing RLS Policies

```sql
-- Test as authenticated user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';

-- Test queries
SELECT * FROM teams;
SELECT * FROM projects;
```

---

## Next Steps

After completing this setup:

1. Create API routes in Next.js
2. Update frontend components to use Supabase queries
3. Implement real-time subscriptions for online status
4. Add error handling and validation
5. Set up database backups
6. Monitor query performance
7. Add additional indexes as needed based on usage patterns

---

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Policies restrict access appropriately
- [ ] Functions use `SECURITY DEFINER` only when necessary
- [ ] User input is validated and sanitized
- [ ] Invite codes are properly validated
- [ ] Work session validation is enforced
- [ ] Foreign key constraints are in place
- [ ] Unique constraints prevent duplicates

---

## Performance Optimization

- [ ] Indexes created for all foreign keys
- [ ] Composite indexes for common query patterns
- [ ] Denormalized fields updated via triggers
- [ ] Full-text search indexes if needed
- [ ] Query performance monitored
- [ ] Connection pooling configured

---

This guide provides a complete setup for the Navigator application backend in Supabase. Follow each step in order and verify after each major section.
