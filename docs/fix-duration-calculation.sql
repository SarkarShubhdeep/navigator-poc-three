-- ============================================
-- FIX DURATION CALCULATION CONSTRAINT
-- ============================================
-- The issue: The check_duration_match constraint is too strict and fails
-- for very short durations due to timing precision differences between
-- JavaScript calculation and PostgreSQL's EXTRACT(EPOCH FROM ...) calculation.
-- 
-- Solution: Relax the constraint to allow a small tolerance (±1 second)
-- or use a database function to calculate duration automatically.

-- Option 1: Relax the constraint with tolerance (RECOMMENDED)
-- This allows for 1 second difference to account for timing precision
ALTER TABLE work_logs DROP CONSTRAINT IF EXISTS check_duration_match;

ALTER TABLE work_logs
ADD CONSTRAINT check_duration_match
CHECK (
  (end_time IS NULL AND duration IS NULL) OR  
  (end_time IS NOT NULL AND duration IS NOT NULL AND 
   ABS(duration - EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER) <= 1)
);

-- Option 2: Use a trigger to auto-calculate duration (ALTERNATIVE)
-- Uncomment below if you prefer automatic calculation
/*
CREATE OR REPLACE FUNCTION calculate_work_log_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_work_log_duration ON work_logs;
CREATE TRIGGER trigger_calculate_work_log_duration
BEFORE INSERT OR UPDATE ON work_logs
FOR EACH ROW
WHEN (NEW.end_time IS NOT NULL)
EXECUTE FUNCTION calculate_work_log_duration();
*/

-- Verify the constraint
SELECT 
  constraint_name, 
  check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
  AND constraint_name = 'check_duration_match';
