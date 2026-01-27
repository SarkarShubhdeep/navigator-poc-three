-- ============================================
-- FIX WORK LOGS END_TIME CONSTRAINT
-- ============================================
-- The issue: end_time is NOT NULL and has constraint check_end_after_start
-- which requires end_time > start_time. When starting a ticket, we need
-- end_time to be NULL until the ticket is paused.
-- Solution: Make end_time nullable and update constraints to allow NULL.

-- Drop existing constraints
ALTER TABLE work_logs DROP CONSTRAINT IF EXISTS check_end_after_start;
ALTER TABLE work_logs DROP CONSTRAINT IF EXISTS check_duration_match;

-- Make end_time nullable
ALTER TABLE work_logs ALTER COLUMN end_time DROP NOT NULL;

-- Make duration nullable (since it can't be calculated until end_time is set)
ALTER TABLE work_logs ALTER COLUMN duration DROP NOT NULL;

-- Recreate constraints that allow NULL values
-- Only check end_time > start_time if end_time is not null
ALTER TABLE work_logs
ADD CONSTRAINT check_end_after_start
CHECK (end_time IS NULL OR end_time > start_time);

-- Only check duration match if both end_time and duration are not null
ALTER TABLE work_logs
ADD CONSTRAINT check_duration_match
CHECK (
  (end_time IS NULL AND duration IS NULL) OR
  (end_time IS NOT NULL AND duration IS NOT NULL AND duration = EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER)
);

-- Verify the changes
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'work_logs'
  AND column_name IN ('start_time', 'end_time', 'duration')
ORDER BY column_name;

-- Verify constraints
SELECT 
  constraint_name, 
  check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
  AND constraint_name IN ('check_end_after_start', 'check_duration_match');
