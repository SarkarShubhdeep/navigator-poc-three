# Project Navigator - Backend Schema Documentation

This document outlines the database schema and data structures for the Project Navigator feature.

## Overview

The Project Navigator is a team-based project management system that tracks work tickets and time spent on them. Each project contains team members and multiple work tickets, with each ticket having a history of work sessions (work logs). Teams can be created by users, and each team generates a unique 6-character invite code that allows other users to join.

## Core Entities

### Team

A team represents a workspace/organization that can contain multiple projects. Each team has a unique invite code for joining.

```typescript
interface Team {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // Team name (e.g., "Acme Corp")
  inviteCode: string;            // 6-character alphanumeric code (unique, uppercase)
  createdBy: string;             // Foreign key to User (team creator/owner)
  createdAt: Date;                // Team creation timestamp
  updatedAt: Date;               // Last update timestamp
  projects: Project[];           // Array of projects in this team (relation)
  members: TeamMember[];        // Array of team members (relation)
}
```

**Database Table: `teams`**
- `id` (UUID, Primary Key)
- `name` (VARCHAR(255), NOT NULL)
- `invite_code` (VARCHAR(6), NOT NULL, UNIQUE, UPPERCASE) - 6-character alphanumeric code
- `created_by` (UUID, Foreign Key to `users`, NOT NULL)
- `created_at` (TIMESTAMP, NOT NULL)
- `updated_at` (TIMESTAMP, NOT NULL)

**Indexes:**
- Unique index on `invite_code` for fast lookups during join process
- Index on `created_by` for user's teams queries

**Invite Code Generation:**
- Format: 6-character alphanumeric (A-Z, 0-9)
- Must be unique across all teams
- Generated on team creation
- Case-insensitive (stored as uppercase)
- Example: "X7Y2Z9", "ABC123"

---

### TeamMember

Represents a user's membership in a team with their role.

```typescript
interface TeamMember {
  id: string;                    // Unique identifier (UUID)
  teamId: string;                // Foreign key to Team
  userId: string;                // Foreign key to User
  role: "owner" | "admin" | "member";  // Member role
  joinedAt: Date;                // When user joined the team
  // Denormalized for quick access:
  fullName?: string;              // Cached from user table
  email: string;                  // Cached from user table
}
```

**Database Table: `team_members`**
- `id` (UUID, Primary Key)
- `team_id` (UUID, Foreign Key to `teams`, NOT NULL)
- `user_id` (UUID, Foreign Key to `users`, NOT NULL)
- `role` (ENUM: 'owner', 'admin', 'member', NOT NULL, default: 'member')
- `joined_at` (TIMESTAMP, NOT NULL)
- `full_name` (VARCHAR, nullable) - Denormalized from users table
- `email` (VARCHAR, NOT NULL) - Denormalized from users table
- Unique constraint: (`team_id`, `user_id`)

**Indexes:**
- Index on `team_id` for fast team member lookups
- Index on `user_id` for fast user team lookups

**Role Definitions:**
- `owner`: Team creator, full control (can delete team, manage all projects)
- `admin`: Can create/manage projects, invite members
- `member`: Can view and work on projects, cannot create projects

---

### Project

A project represents a workspace within a team containing tickets and team members. Projects belong to teams.

```typescript
interface Project {
  id: string;                    // Unique identifier (UUID)
  name: string;                   // Project name (e.g., "Project Navigator")
  teamId: string;                // Foreign key to Team (required)
  description?: string;           // Optional project description
  createdBy: string;              // Foreign key to User (project creator)
  createdAt: Date;                // Project creation timestamp
  updatedAt: Date;                // Last update timestamp
  members: ProjectMember[];       // Array of project members (relation)
  tickets: Ticket[];              // Array of work tickets (relation)
}
```

**Database Table: `projects`**
- `id` (UUID, Primary Key)
- `name` (VARCHAR(255), NOT NULL)
- `team_id` (UUID, Foreign Key to `teams`, NOT NULL)
- `description` (TEXT, nullable)
- `created_by` (UUID, Foreign Key to `users`, NOT NULL)
- `created_at` (TIMESTAMP, NOT NULL)
- `updated_at` (TIMESTAMP, NOT NULL)

**Indexes:**
- Index on `team_id` for fast team project lookups
- Index on `created_by` for user's created projects

---

### ProjectMember

Represents a user's membership in a project with their role and status.

```typescript
interface ProjectMember {
  id: string;                    // Unique identifier (UUID)
  projectId: string;             // Foreign key to Project
  userId: string;                // Foreign key to User
  role: "owner" | "member" | "viewer";  // Member role
  isOnline: boolean;              // Current online status (real-time)
  joinedAt: Date;                // When user joined the project
  // Denormalized for quick access:
  fullName?: string;              // Cached from user table
  email: string;                  // Cached from user table
}
```

**Database Table: `project_members`**
- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key to `projects`, NOT NULL)
- `user_id` (UUID, Foreign Key to `users`, NOT NULL)
- `role` (ENUM: 'owner', 'member', 'viewer', NOT NULL, default: 'member')
- `is_online` (BOOLEAN, NOT NULL, default: false)
- `joined_at` (TIMESTAMP, NOT NULL)
- `full_name` (VARCHAR, nullable) - Denormalized from users table
- `email` (VARCHAR, NOT NULL) - Denormalized from users table
- Unique constraint: (`project_id`, `user_id`)

**Indexes:**
- Index on `project_id` for fast project member lookups
- Index on `user_id` for fast user project lookups
- Index on `is_online` for online status queries

---

### Ticket

A work ticket represents a task or item that team members can work on.

```typescript
enum TicketStatus {
  OPEN = "open",      // Ticket is open and available for work
  ACTIVE = "active",  // Ticket is currently being worked on
  CLOSED = "close"    // Ticket is closed/completed
}

enum TicketPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

interface Ticket {
  id: string;                    // Unique identifier (UUID)
  projectId: string;             // Foreign key to Project
  title: string;                  // Ticket title
  description: string;            // Detailed description
  status: TicketStatus;           // Current status
  priority: TicketPriority;       // Priority level
  assignedToUserId: string;       // Foreign key to User (who is assigned)
  lastWorkedOn?: Date;           // Timestamp of last work log (denormalized)
  totalDuration: number;          // Total seconds worked (denormalized, sum of work logs)
  createdAt: Date;                // Ticket creation timestamp
  updatedAt: Date;                // Last update timestamp
  workLogs: WorkLog[];            // Array of work sessions (relation)
}
```

**Database Table: `tickets`**
- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key to `projects`, NOT NULL)
- `title` (VARCHAR(255), NOT NULL)
- `description` (TEXT, nullable)
- `status` (ENUM: 'open', 'active', 'close', NOT NULL, default: 'open')
- `priority` (ENUM: 'low', 'medium', 'high', 'critical', NOT NULL, default: 'medium')
- `assigned_to_user_id` (UUID, Foreign Key to `users`, NOT NULL)
- `last_worked_on` (TIMESTAMP, nullable) - Denormalized from work_logs
- `total_duration` (INTEGER, NOT NULL, default: 0) - Total seconds, denormalized
- `created_at` (TIMESTAMP, NOT NULL)
- `updated_at` (TIMESTAMP, NOT NULL)

**Indexes:**
- Index on `project_id` for fast project ticket lookups
- Index on `assigned_to_user_id` for "my tickets" queries
- Index on `status` for filtering by status
- Index on `last_worked_on` for sorting by recent activity
- Composite index on (`project_id`, `status`) for filtered project queries

---

### WorkSession

Represents a user's clocked-in work session. Users must be clocked in to work on tickets. Only one active work session per user at a time.

```typescript
interface WorkSession {
  id: string;                    // Unique identifier (UUID)
  userId: string;                // Foreign key to User
  projectId?: string;            // Optional: Foreign key to Project (if session is project-specific)
  clockInTime: Date;             // When user clocked in
  clockOutTime?: Date;            // When user clocked out (NULL if currently active)
  totalDuration: number;         // Total duration in seconds (calculated when clocked out)
  isActive: boolean;             // Whether session is currently active (denormalized)
  createdAt: Date;               // Session creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

**Database Table: `work_sessions`**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to `users`, NOT NULL)
- `project_id` (UUID, Foreign Key to `projects`, nullable) - Optional: can be project-specific or global
- `clock_in_time` (TIMESTAMP, NOT NULL)
- `clock_out_time` (TIMESTAMP, nullable) - NULL when session is active
- `total_duration` (INTEGER, nullable) - Calculated in seconds when clocked out
- `is_active` (BOOLEAN, NOT NULL, default: true) - Denormalized flag for quick queries
- `created_at` (TIMESTAMP, NOT NULL)
- `updated_at` (TIMESTAMP, NOT NULL)

**Indexes:**
- Index on `user_id` for fast user session lookups
- Index on `is_active` for finding active sessions
- Index on `clock_in_time` for chronological sorting
- Composite index on (`user_id`, `is_active`) for finding user's active session
- Index on `project_id` for project-specific session queries

**Constraints:**
- Only one active session per user at a time (enforced via application logic or unique constraint with partial index)
- `clock_out_time` must be after `clock_in_time` (if not NULL)
- `total_duration` should match `clock_out_time - clock_in_time` (if clocked out)

**Business Rules:**
- User can only have ONE active work session at a time
- When user clocks in, any existing active session must be clocked out first
- Work sessions can be project-specific (if `project_id` is set) or global (if NULL)
- Timer displays elapsed time in HH:MM:SS format while session is active
- Users can only start ticket timers (work on tickets) when they have an active work session

---

### WorkLog

Represents a single work session on a ticket. A ticket can have multiple work logs. **IMPORTANT: Work logs can only be created during an active work session.**

```typescript
interface WorkLog {
  id: string;                    // Unique identifier (UUID)
  ticketId: string;             // Foreign key to Ticket
  userId: string;                // Foreign key to User (who did the work)
  workSessionId: string;         // Foreign key to WorkSession (REQUIRED)
  startTime: Date;               // When work started
  endTime: Date;                 // When work ended
  duration: number;              // Duration in seconds (calculated: endTime - startTime)
  description?: string;          // Optional: what was done during this session
  createdAt: Date;               // Work log creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

**Database Table: `work_logs`**
- `id` (UUID, Primary Key)
- `ticket_id` (UUID, Foreign Key to `tickets`, NOT NULL)
- `user_id` (UUID, Foreign Key to `users`, NOT NULL)
- `work_session_id` (UUID, Foreign Key to `work_sessions`, NOT NULL) - **REQUIRED**
- `start_time` (TIMESTAMP, NOT NULL)
- `end_time` (TIMESTAMP, NOT NULL)
- `duration` (INTEGER, NOT NULL) - Calculated in seconds
- `description` (TEXT, nullable)
- `created_at` (TIMESTAMP, NOT NULL)
- `updated_at` (TIMESTAMP, NOT NULL)

**Indexes:**
- Index on `ticket_id` for fast ticket work history lookups
- Index on `user_id` for user work history queries
- Index on `work_session_id` for session work log queries
- Index on `start_time` for chronological sorting
- Composite index on (`ticket_id`, `start_time`) for ordered ticket history
- Composite index on (`work_session_id`, `start_time`) for session work logs

**Constraints:**
- `end_time` must be after `start_time`
- `duration` should match `end_time - start_time` (enforced via trigger or application logic)
- `work_session_id` must reference an active work session when work log is created
- `start_time` and `end_time` must fall within the work session's `clock_in_time` and `clock_out_time` (or current time if active)

**Business Rules:**
- **Work logs can ONLY be created when user has an active work session**
- When starting work on a ticket, validate that user has an active `work_sessions` record
- All ticket work must be associated with a work session
- Multiple work logs can belong to the same work session (user can work on multiple tickets during one session)

---

## Denormalization Strategy

To optimize read performance, we denormalize certain fields:

1. **`tickets.total_duration`**: Sum of all `work_logs.duration` for the ticket
   - Updated via database trigger or application logic when work logs are created/updated/deleted
   - Reduces need for expensive SUM() aggregations

2. **`tickets.last_worked_on`**: Most recent `work_logs.end_time` for the ticket
   - Updated via database trigger or application logic
   - Enables fast sorting by "recently worked on"

3. **`project_members.full_name` and `email`**: Cached from `users` table
   - Reduces joins when displaying member lists
   - Should be kept in sync via triggers or application logic when user data changes

---

## Relationships

```
Team (1) ──< (many) TeamMember
Team (1) ──< (many) Project
Project (1) ──< (many) ProjectMember
Project (1) ──< (many) Ticket
Project (1) ──< (many) WorkSession (optional, if project-specific)
Ticket (1) ──< (many) WorkLog
WorkSession (1) ──< (many) WorkLog (REQUIRED - all work logs must belong to a session)
User (1) ──< (many) TeamMember
User (1) ──< (many) ProjectMember
User (1) ──< (many) Ticket (assigned_to_user_id)
User (1) ──< (many) WorkSession (one active at a time)
User (1) ──< (many) WorkLog
User (1) ──< (many) Team (created_by)
User (1) ──< (many) Project (created_by)
```

---

## Query Patterns

### Get Project with Members and Tickets
```sql
SELECT 
  p.*,
  json_agg(DISTINCT jsonb_build_object(
    'id', pm.id,
    'userId', pm.user_id,
    'fullName', pm.full_name,
    'email', pm.email,
    'isOnline', pm.is_online
  )) as members,
  json_agg(DISTINCT jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'status', t.status,
    'priority', t.priority,
    'totalDuration', t.total_duration,
    'lastWorkedOn', t.last_worked_on
  )) as tickets
FROM projects p
LEFT JOIN project_members pm ON pm.project_id = p.id
LEFT JOIN tickets t ON t.project_id = p.id
WHERE p.id = $1
GROUP BY p.id;
```

### Get Ticket with Work History
```sql
SELECT 
  t.*,
  json_agg(
    jsonb_build_object(
      'id', wl.id,
      'startTime', wl.start_time,
      'endTime', wl.end_time,
      'duration', wl.duration,
      'description', wl.description
    ) ORDER BY wl.start_time DESC
  ) as work_logs
FROM tickets t
LEFT JOIN work_logs wl ON wl.ticket_id = t.id
WHERE t.id = $1
GROUP BY t.id;
```

### Get User's Tickets in Project
```sql
SELECT * FROM tickets
WHERE project_id = $1 
  AND assigned_to_user_id = $2
ORDER BY last_worked_on DESC NULLS LAST, created_at DESC;
```

### Update Ticket Total Duration (Trigger Example)
```sql
CREATE OR REPLACE FUNCTION update_ticket_duration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tickets
  SET 
    total_duration = (
      SELECT COALESCE(SUM(duration), 0)
      FROM work_logs
      WHERE ticket_id = NEW.ticket_id
    ),
    last_worked_on = (
      SELECT MAX(end_time)
      FROM work_logs
      WHERE ticket_id = NEW.ticket_id
    )
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_log_duration_update
AFTER INSERT OR UPDATE OR DELETE ON work_logs
FOR EACH ROW
EXECUTE FUNCTION update_ticket_duration();
```

---

## Real-time Considerations

### Online Status
- `project_members.is_online` should be updated via:
  - WebSocket connection status
  - Heartbeat mechanism (update every 30 seconds when user is active)
  - Set to `false` when user disconnects or after timeout (e.g., 2 minutes)

### Active Work Sessions
- When a user starts working on a ticket (status → "active"), create a `work_log` with:
  - `start_time` = current timestamp
  - `end_time` = NULL (or future timestamp as placeholder)
  - Update `tickets.status` to "active"
- When work session ends:
  - Update `work_log.end_time` = current timestamp
  - Calculate and set `duration`
  - Update `tickets.status` back to "open" (or keep as "active" if continuing)

---

## Work Session Management

### Clocking In (Starting Work Session)

**Flow:**
1. User clicks "Start your work session" button in the Live Clock component
2. System validates:
   - User does not have an active work session
   - If user has an active session, clock it out first (or prevent new session)
3. Create new `work_sessions` record:
   - `user_id` = current user
   - `project_id` = current project (optional, can be NULL for global session)
   - `clock_in_time` = current timestamp
   - `clock_out_time` = NULL
   - `is_active` = true
4. UI updates:
   - Live clock (showing current time) is replaced with timer
   - Timer displays elapsed time in HH:MM:SS format (e.g., "02:15:30")
   - Timer updates every second while session is active
   - "Start your work session" button is hidden/replaced with clock out option

**Database Transaction:**
```sql
BEGIN;
  -- Check for existing active session
  SELECT id FROM work_sessions 
  WHERE user_id = $1 AND is_active = true 
  FOR UPDATE;
  
  -- If active session exists, clock it out first
  UPDATE work_sessions
  SET 
    clock_out_time = NOW(),
    total_duration = EXTRACT(EPOCH FROM (NOW() - clock_in_time))::INTEGER,
    is_active = false,
    updated_at = NOW()
  WHERE user_id = $1 AND is_active = true;
  
  -- Create new active session
  INSERT INTO work_sessions (
    id, user_id, project_id, clock_in_time, 
    clock_out_time, is_active, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), 
    $1, 
    $2,  -- project_id (can be NULL)
    NOW(), 
    NULL, 
    true, 
    NOW(), 
    NOW()
  )
  RETURNING *;
COMMIT;
```

**API Endpoint:**
- `POST /api/work-sessions/clock-in` - Start work session
  - Body: `{ projectId?: string }` (optional)
  - Returns: `{ workSession: WorkSession, elapsedTime: number }`

### Clocking Out (Ending Work Session)

**Flow:**
1. User clicks clock out button (replaces "Start your work session")
2. System:
   - Finds active work session for user
   - Sets `clock_out_time` = current timestamp
   - Calculates `total_duration` = `clock_out_time - clock_in_time`
   - Sets `is_active` = false
3. UI updates:
   - Timer is replaced with live clock (current time)
   - "Start your work session" button is shown again

**Database Transaction:**
```sql
BEGIN;
  -- Find and lock active session
  SELECT id, clock_in_time FROM work_sessions 
  WHERE user_id = $1 AND is_active = true 
  FOR UPDATE;
  
  -- Clock out
  UPDATE work_sessions
  SET 
    clock_out_time = NOW(),
    total_duration = EXTRACT(EPOCH FROM (NOW() - clock_in_time))::INTEGER,
    is_active = false,
    updated_at = NOW()
  WHERE user_id = $1 AND is_active = true
  RETURNING *;
COMMIT;
```

**API Endpoint:**
- `POST /api/work-sessions/clock-out` - End work session
  - Returns: `{ workSession: WorkSession, totalDuration: number }`

### Timer Display During Active Session

**Frontend Behavior:**
- When user has active work session:
  - Live clock component shows timer instead of current time
  - Timer format: HH:MM:SS (e.g., "02:15:30" for 2 hours, 15 minutes, 30 seconds)
  - Timer updates every second
  - Elapsed time = `NOW() - work_session.clock_in_time`
  - Timer is displayed in the same position as the live clock

**Calculation:**
```typescript
function getElapsedTime(clockInTime: Date): number {
  const now = new Date();
  return Math.floor((now.getTime() - clockInTime.getTime()) / 1000);
}

function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
```

**API Endpoint:**
- `GET /api/work-sessions/active` - Get user's active work session
  - Returns: `{ workSession: WorkSession | null, elapsedTime: number }`
  - Used to poll/update timer display

### Working on Tickets During Work Session

**Business Rule:**
- **Users can ONLY start working on tickets when they have an active work session**
- When user clicks play button on a ticket:
  1. Validate user has active `work_sessions` record
  2. If no active session, show error or prompt to clock in first
  3. If active session exists, proceed with ticket work

**Ticket Work Flow (During Active Session):**
1. User clicks play button on ticket
2. System validates:
   - User has active work session (`work_sessions.is_active = true`)
   - Ticket status is "open" (cannot start closed tickets)
   - User is assigned to ticket (optional requirement)
3. Create `work_log` record:
   - `ticket_id` = selected ticket
   - `user_id` = current user
   - `work_session_id` = active work session ID (**REQUIRED**)
   - `start_time` = current timestamp
   - `end_time` = NULL (will be set when paused)
   - `duration` = 0 (will be calculated when paused)
4. Update ticket:
   - `status` = "active"
5. When user pauses ticket:
   - Update `work_log.end_time` = current timestamp
   - Calculate `work_log.duration` = `end_time - start_time`
   - Show work log dialog for description
   - Update ticket `status` = "open"
   - Update ticket `total_duration` and `last_worked_on` (via trigger)

**Validation Query:**
```sql
-- Check if user has active work session before allowing ticket work
SELECT id, clock_in_time 
FROM work_sessions 
WHERE user_id = $1 AND is_active = true;

-- If no active session, reject ticket work request
-- If active session exists, proceed with creating work_log
```

**Database Transaction for Starting Ticket Work:**
```sql
BEGIN;
  -- Validate active work session
  SELECT id INTO active_session_id
  FROM work_sessions 
  WHERE user_id = $1 AND is_active = true;
  
  IF active_session_id IS NULL THEN
    RAISE EXCEPTION 'User must be clocked in to work on tickets';
  END IF;
  
  -- Create work log
  INSERT INTO work_logs (
    id, ticket_id, user_id, work_session_id,
    start_time, end_time, duration, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    $2,  -- ticket_id
    $1,  -- user_id
    active_session_id,
    NOW(),
    NULL,  -- Will be set when paused
    0,     -- Will be calculated when paused
    NOW(),
    NOW()
  );
  
  -- Update ticket status
  UPDATE tickets
  SET status = 'active', updated_at = NOW()
  WHERE id = $2;
  
COMMIT;
```

**API Endpoints:**
- `POST /api/tickets/:id/start` - Start working on ticket
  - **Requires:** Active work session
  - Creates work log with `work_session_id`
  - Returns: `{ workLog: WorkLog, ticket: Ticket }`
  
- `POST /api/tickets/:id/pause` - Pause ticket work
  - Updates work log with end time and duration
  - Returns: `{ workLog: WorkLog, ticket: Ticket }`

### Query Patterns for Work Sessions

**Get User's Active Work Session:**
```sql
SELECT 
  id,
  user_id,
  project_id,
  clock_in_time,
  EXTRACT(EPOCH FROM (NOW() - clock_in_time))::INTEGER as elapsed_seconds
FROM work_sessions
WHERE user_id = $1 AND is_active = true;
```

**Get User's Work Sessions (History):**
```sql
SELECT 
  id,
  project_id,
  clock_in_time,
  clock_out_time,
  total_duration,
  is_active
FROM work_sessions
WHERE user_id = $1
ORDER BY clock_in_time DESC;
```

**Get Work Logs for a Work Session:**
```sql
SELECT 
  wl.*,
  t.title as ticket_title,
  t.project_id
FROM work_logs wl
JOIN tickets t ON t.id = wl.ticket_id
WHERE wl.work_session_id = $1
ORDER BY wl.start_time DESC;
```

**Get Today's Work Session Summary:**
```sql
SELECT 
  ws.id,
  ws.clock_in_time,
  ws.clock_out_time,
  ws.total_duration,
  COUNT(wl.id) as tickets_worked_on,
  SUM(wl.duration) as total_ticket_work_duration
FROM work_sessions ws
LEFT JOIN work_logs wl ON wl.work_session_id = ws.id
WHERE ws.user_id = $1
  AND DATE(ws.clock_in_time) = CURRENT_DATE
GROUP BY ws.id, ws.clock_in_time, ws.clock_out_time, ws.total_duration;
```

---

## Team Creation and Joining Logic

### Creating a Team

**Flow:**
1. User navigates to "Add Team" → "Create Team"
2. User enters team name
3. System creates a new team:
   - Generate unique 6-character invite code (alphanumeric, uppercase)
   - Create team record with `created_by` = current user
   - Create `team_members` record with role = "owner"
   - Return team with invite code

**Invite Code Generation Algorithm:**
```typescript
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    attempts++;
  } while (codeExists(code) && attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique invite code');
  }
  
  return code;
}
```

**Database Transaction:**
```sql
BEGIN;
  -- Create team
  INSERT INTO teams (id, name, invite_code, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
  RETURNING *;
  
  -- Add creator as owner
  INSERT INTO team_members (id, team_id, user_id, role, joined_at, full_name, email)
  VALUES (
    gen_random_uuid(),
    (SELECT id FROM teams WHERE invite_code = $2),
    $3,
    'owner',
    NOW(),
    (SELECT full_name FROM users WHERE id = $3),
    (SELECT email FROM users WHERE id = $3)
  );
COMMIT;
```

### Joining a Team

**Flow:**
1. User navigates to "Add Team" → "Join Team"
2. User enters 6-character invite code
3. System validates code:
   - Check if code exists in `teams` table
   - Check if user is already a member
   - If valid, add user as team member with role = "member"
   - Redirect to team's default project or team dashboard

**Validation Logic:**
```typescript
async function joinTeam(inviteCode: string, userId: string) {
  // Normalize code (uppercase, remove non-alphanumeric)
  const normalizedCode = inviteCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (normalizedCode.length !== 6) {
    throw new Error('Invalid invite code format');
  }
  
  // Find team by invite code
  const team = await db.query(
    'SELECT * FROM teams WHERE invite_code = $1',
    [normalizedCode]
  );
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  // Check if user is already a member
  const existingMember = await db.query(
    'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
    [team.id, userId]
  );
  
  if (existingMember) {
    throw new Error('User is already a member of this team');
  }
  
  // Add user as member
  await db.query(
    `INSERT INTO team_members (id, team_id, user_id, role, joined_at, full_name, email)
     VALUES (gen_random_uuid(), $1, $2, 'member', NOW(), 
             (SELECT full_name FROM users WHERE id = $2),
             (SELECT email FROM users WHERE id = $2))`,
    [team.id, userId]
  );
  
  return team;
}
```

**Database Transaction:**
```sql
BEGIN;
  -- Verify team exists
  SELECT id FROM teams WHERE invite_code = $1 FOR UPDATE;
  
  -- Check if already a member
  SELECT id FROM team_members WHERE team_id = (SELECT id FROM teams WHERE invite_code = $1) AND user_id = $2;
  
  -- Add as member if not already
  INSERT INTO team_members (id, team_id, user_id, role, joined_at, full_name, email)
  VALUES (
    gen_random_uuid(),
    (SELECT id FROM teams WHERE invite_code = $1),
    $2,
    'member',
    NOW(),
    (SELECT full_name FROM users WHERE id = $2),
    (SELECT email FROM users WHERE id = $2)
  );
COMMIT;
```

### Team Invite Code Management

**Code Requirements:**
- 6 characters, alphanumeric (A-Z, 0-9)
- Case-insensitive (stored as uppercase)
- Must be unique across all teams
- Never expires (unless team is deleted)
- Can be regenerated by team owner (optional feature)

**Security Considerations:**
- Invite codes are not secret - anyone with the code can join
- Consider adding expiration dates for sensitive teams
- Consider adding join limits (max members per team)
- Consider requiring approval for joining (optional feature)

---

## API Endpoints (Suggested)

### Teams
- `GET /api/teams` - Get user's teams
- `GET /api/teams/:id` - Get team details
- `POST /api/teams` - Create new team (generates invite code)
- `PATCH /api/teams/:id` - Update team (name, etc.)
- `DELETE /api/teams/:id` - Delete team (owner only)
- `POST /api/teams/join` - Join team by invite code
- `GET /api/teams/:id/invite-code` - Get team invite code (members only)
- `POST /api/teams/:id/regenerate-invite-code` - Regenerate invite code (owner only)

### Projects
- `GET /api/projects/:id` - Get project with members and tickets
- `POST /api/teams/:teamId/projects` - Create new project in team
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Work Sessions
- `GET /api/work-sessions/active` - Get user's active work session (with elapsed time)
- `GET /api/work-sessions` - Get user's work session history
- `GET /api/work-sessions/:id` - Get work session details with work logs
- `POST /api/work-sessions/clock-in` - Clock in (start work session)
- `POST /api/work-sessions/clock-out` - Clock out (end work session)
- `GET /api/work-sessions/:id/work-logs` - Get all work logs for a session

### Tickets
- `GET /api/projects/:projectId/tickets` - List tickets (with filters)
- `GET /api/tickets/:id` - Get ticket with work history
- `POST /api/projects/:projectId/tickets` - Create new ticket
- `PATCH /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `POST /api/tickets/:id/start` - Start working on ticket (requires active work session, creates work log)
- `POST /api/tickets/:id/pause` - Pause ticket work (updates work log end time)

### Work Logs
- `GET /api/tickets/:ticketId/work-logs` - Get work history for ticket
- `GET /api/work-sessions/:sessionId/work-logs` - Get work logs for a work session
- `POST /api/work-logs` - Create work log (manual entry - requires active work session)
- `PATCH /api/work-logs/:id` - Update work log
- `DELETE /api/work-logs/:id` - Delete work log

### Project Members
- `GET /api/projects/:id/members` - Get project members
- `POST /api/projects/:id/members` - Add member to project
- `PATCH /api/projects/:id/members/:userId` - Update member role
- `DELETE /api/projects/:id/members/:userId` - Remove member

---

## Implementation Notes

### Work Session Enforcement

**Critical Business Rules:**
1. **Users MUST be clocked in to work on tickets**
   - All `work_logs` must have a valid `work_session_id`
   - Validate active session before allowing ticket work
   - Return error if user tries to start ticket work without active session

2. **Only one active work session per user**
   - Enforce at database level with unique partial index or application logic
   - When clocking in, automatically clock out any existing active session

3. **Work session timer display**
   - Calculate elapsed time: `NOW() - clock_in_time`
   - Format as HH:MM:SS
   - Update every second on frontend (poll backend or use WebSocket)

4. **Work log creation during session**
   - `work_log.start_time` must be >= `work_session.clock_in_time`
   - `work_log.end_time` must be <= `work_session.clock_out_time` (or NOW if active)
   - All work logs for a session should fall within session time bounds

### Database Constraints and Triggers

**Unique Active Session Constraint:**
```sql
-- Ensure only one active session per user
CREATE UNIQUE INDEX idx_one_active_session_per_user 
ON work_sessions (user_id) 
WHERE is_active = true;
```

**Work Log Validation Trigger:**
```sql
CREATE OR REPLACE FUNCTION validate_work_log_session()
RETURNS TRIGGER AS $$
DECLARE
  session_record work_sessions%ROWTYPE;
BEGIN
  -- Get the work session
  SELECT * INTO session_record
  FROM work_sessions
  WHERE id = NEW.work_session_id;
  
  -- Validate session exists and is active
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work session not found';
  END IF;
  
  IF NOT session_record.is_active THEN
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

CREATE TRIGGER work_log_session_validation
BEFORE INSERT OR UPDATE ON work_logs
FOR EACH ROW
EXECUTE FUNCTION validate_work_log_session();
```

---

## Notes

1. **Soft Deletes**: Consider adding `deleted_at` timestamp for soft deletes instead of hard deletes
2. **Audit Trail**: Consider adding audit logs for ticket status changes and assignments
3. **Permissions**: Implement role-based access control (RBAC) for project operations
4. **Notifications**: Track notification preferences in `project_members` or separate table
5. **Search**: Consider full-text search indexes on `tickets.title` and `tickets.description` for better search performance
6. **Work Session Timeouts**: Consider auto-clocking out users after inactivity (e.g., 4 hours)
7. **Session Persistence**: Store active session state in Redis for quick lookups and real-time updates
