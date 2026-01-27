-- ============================================
-- DELETE ALL TICKETS AND RELATED DATA
-- ============================================
-- This script deletes all tickets and their related work logs.
-- Since ticket_details is a VIEW (read-only), we delete from the underlying tables.
-- 
-- WARNING: This will permanently delete ALL tickets and work logs!
-- Use with caution. This is for development/testing purposes only.

-- Delete in order to respect foreign key constraints:
-- 1. First delete work_logs (they reference tickets)
-- 2. Then delete tickets

-- Delete all work logs
DELETE FROM work_logs;

-- Delete all tickets
DELETE FROM tickets;

-- Verify deletion
SELECT 
    (SELECT COUNT(*) FROM tickets) as tickets_count,
    (SELECT COUNT(*) FROM work_logs) as work_logs_count;

-- Note: ticket_details is a VIEW, so it will automatically reflect the empty state
-- after deleting from the underlying tickets table.
