-- ============================================
-- SEED DATA: Team Rhombus, Project Walrus
-- ============================================
-- Team Rhombus: pharmaceutical brand website design
-- Project Walrus (id: 8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f)
-- Members: Sean (5 tickets), Jesse (7), Deepak (3), Monica (10) = 25 tickets
-- Work sessions: Jan 18–25, 2026 (all four members, multiple days)
-- ticket_details is a VIEW; seeding tickets, work_sessions, work_logs populates it.
--
-- IDs from SEED_DATA_STARTER.md:
--   Sean (Shawn): 24e9b44a-6342-4813-bb60-05adeba998b4
--   Jesse:        d89abfe8-bf43-4c08-8c6c-2d9cee8ace35
--   Deepak:       02268f27-e994-49f4-bb87-634f7ffc437f
--   Monica:       d4d398e1-9d0f-4e00-aa5d-249fffd83d84
--   Project:      8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f
-- ============================================

-- ============================================
-- TEMPORARILY DISABLE VALIDATION TRIGGER
-- ============================================
-- Disable the work_log_session_validation trigger to allow seeding historical data
-- (work sessions are clocked out, but we're inserting work logs for them)
ALTER TABLE work_logs DISABLE TRIGGER work_log_session_validation;

-- Optional: clear existing data for this project (uncomment to re-run clean)
-- DELETE FROM work_logs WHERE ticket_id IN (SELECT id FROM tickets WHERE project_id = '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f');
-- DELETE FROM work_sessions WHERE user_id IN ('24e9b44a-6342-4813-bb60-05adeba998b4','d89abfe8-bf43-4c08-8c6c-2d9cee8ace35','02268f27-e994-49f4-bb87-634f7ffc437f','d4d398e1-9d0f-4e00-aa5d-249fffd83d84') AND clock_in_time >= '2026-01-18' AND clock_in_time < '2026-01-26';
-- DELETE FROM tickets WHERE project_id = '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f';

-- ============================================
-- 1. TICKETS (25) – Project Walrus, pharma website
-- ============================================
-- Sean 5, Jesse 7, Deepak 3, Monica 10

INSERT INTO tickets (id, project_id, title, description, status, priority, assigned_to_user_id, last_worked_on, total_duration, created_at, updated_at) VALUES
-- Sean's 5 tickets
('a1000001-1464-4e5d-80c2-6b4dd2fbbc01', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Homepage hero and navigation', 'Main landing hero and global nav for pharma brand.', 'close', 'high', '24e9b44a-6342-4813-bb60-05adeba998b4', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a1000002-1464-4e5d-80c2-6b4dd2fbbc02', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Product catalog listing page', 'Product listing with filters for pharma products.', 'close', 'medium', '24e9b44a-6342-4813-bb60-05adeba998b4', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a1000003-1464-4e5d-80c2-6b4dd2fbbc03', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Regulatory disclaimer footer', 'Footer copy and component for regulatory disclaimers.', 'close', 'high', '24e9b44a-6342-4813-bb60-05adeba998b4', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a1000004-1464-4e5d-80c2-6b4dd2fbbc04', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Contact and support section', 'Contact form and support links for the site.', 'close', 'medium', '24e9b44a-6342-4813-bb60-05adeba998b4', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a1000005-1464-4e5d-80c2-6b4dd2fbbc05', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Prescriber portal login', 'Login flow and session handling for prescriber portal.', 'close', 'critical', '24e9b44a-6342-4813-bb60-05adeba998b4', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
-- Jesse's 7 tickets
('a2000001-1464-4e5d-80c2-6b4dd2fbbc11', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Drug information display component', 'Reusable component for drug/disease information blocks.', 'close', 'high', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a2000002-1464-4e5d-80c2-6b4dd2fbbc12', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Patient education content section', 'Structured content and layout for patient education.', 'close', 'medium', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a2000003-1464-4e5d-80c2-6b4dd2fbbc13', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Responsive layout for mobile', 'Breakpoints and mobile layout for key pages.', 'close', 'high', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a2000004-1464-4e5d-80c2-6b4dd2fbbc14', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Accessibility compliance (WCAG)', 'WCAG 2.1 AA audit and fixes across the site.', 'close', 'high', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a2000005-1464-4e5d-80c2-6b4dd2fbbc15', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Clinical trials information page', 'Page and components for clinical trials info.', 'close', 'medium', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a2000006-1464-4e5d-80c2-6b4dd2fbbc16', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Insurance coverage checker widget', 'Widget for patients to check coverage/eligibility.', 'close', 'medium', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a2000007-1464-4e5d-80c2-6b4dd2fbbc17', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Medical information request form', 'Form and validation for medical info requests.', 'close', 'low', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
-- Deepak's 3 tickets
('a3000001-1464-4e5d-80c2-6b4dd2fbbc21', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Site search and filters', 'Global search and filter behavior for catalog.', 'close', 'medium', '02268f27-e994-49f4-bb87-634f7ffc437f', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a3000002-1464-4e5d-80c2-6b4dd2fbbc22', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Brand assets and style guide', 'Pharma brand assets and style guide implementation.', 'close', 'high', '02268f27-e994-49f4-bb87-634f7ffc437f', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a3000003-1464-4e5d-80c2-6b4dd2fbbc23', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'FDA approval badge component', 'Reusable badge/indicator for FDA approval messaging.', 'close', 'low', '02268f27-e994-49f4-bb87-634f7ffc437f', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
-- Monica's 10 tickets
('a4000001-1464-4e5d-80c2-6b4dd2fbbc31', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Side effects and interactions section', 'Structured content for side effects and interactions.', 'close', 'high', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a4000002-1464-4e5d-80c2-6b4dd2fbbc32', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Dosage and administration component', 'Component for dosage and administration copy.', 'close', 'high', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a4000003-1464-4e5d-80c2-6b4dd2fbbc33', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Refill reminder feature', 'Reminder flow and copy for refill reminders.', 'close', 'medium', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a4000004-1464-4e5d-80c2-6b4dd2fbbc34', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Newsletter signup and consent', 'Newsletter form and consent/validation.', 'close', 'low', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a4000005-1464-4e5d-80c2-6b4dd2fbbc35', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Cookie and privacy banner', 'Banner component and preferences for cookies/privacy.', 'close', 'medium', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a4000006-1464-4e5d-80c2-6b4dd2fbbc36', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'PDF viewer for leaflets', 'In-app PDF viewer for patient leaflets/documents.', 'close', 'medium', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a4000007-1464-4e5d-80c2-6b4dd2fbbc37', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Multi-language support setup', 'i18n setup and language switcher for key pages.', 'close', 'high', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a4000008-1464-4e5d-80c2-6b4dd2fbbc38', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Analytics and tracking implementation', 'GA/analytics and event tracking across the site.', 'close', 'medium', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a4000009-1464-4e5d-80c2-6b4dd2fbbc39', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Security and HIPAA considerations', 'Security review and HIPAA-related documentation.', 'close', 'critical', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00'),
('a4000010-1464-4e5d-80c2-6b4dd2fbbc3a', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'Loading and error states', 'Global loading and error state patterns and copy.', 'close', 'low', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', NULL, 0, '2026-01-17 10:00:00+00', '2026-01-17 10:00:00+00');

-- ============================================
-- 2. WORK SESSIONS – Jan 18–25, 2026 (all four, multiple days)
-- ============================================
-- Each user gets several sessions in the range; all clocked out (is_active = false).
-- project_id set to Walrus for context.

INSERT INTO work_sessions (id, user_id, project_id, clock_in_time, clock_out_time, total_duration, is_active, created_at, updated_at) VALUES
-- Sean: 18, 19, 20, 21, 22
('b1000001-1464-4e5d-80c2-6b4dd2fbbc01', '24e9b44a-6342-4813-bb60-05adeba998b4', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-18 09:00:00+00', '2026-01-18 12:30:00+00', 12600, false, '2026-01-18 09:00:00+00', '2026-01-18 12:30:00+00'),
('b1000002-1464-4e5d-80c2-6b4dd2fbbc02', '24e9b44a-6342-4813-bb60-05adeba998b4', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-19 09:00:00+00', '2026-01-19 11:00:00+00', 7200, false, '2026-01-19 09:00:00+00', '2026-01-19 11:00:00+00'),
('b1000003-1464-4e5d-80c2-6b4dd2fbbc03', '24e9b44a-6342-4813-bb60-05adeba998b4', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-20 10:00:00+00', '2026-01-20 13:00:00+00', 10800, false, '2026-01-20 10:00:00+00', '2026-01-20 13:00:00+00'),
('b1000004-1464-4e5d-80c2-6b4dd2fbbc04', '24e9b44a-6342-4813-bb60-05adeba998b4', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-21 08:30:00+00', '2026-01-21 12:00:00+00', 12600, false, '2026-01-21 08:30:00+00', '2026-01-21 12:00:00+00'),
('b1000005-1464-4e5d-80c2-6b4dd2fbbc05', '24e9b44a-6342-4813-bb60-05adeba998b4', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-22 09:00:00+00', '2026-01-22 11:30:00+00', 9000, false, '2026-01-22 09:00:00+00', '2026-01-22 11:30:00+00'),
-- Jesse: 18, 19, 20, 21, 22, 23
('b2000001-1464-4e5d-80c2-6b4dd2fbbc11', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-18 09:30:00+00', '2026-01-18 17:00:00+00', 27000, false, '2026-01-18 09:30:00+00', '2026-01-18 17:00:00+00'),
('b2000002-1464-4e5d-80c2-6b4dd2fbbc12', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-19 10:00:00+00', '2026-01-19 15:00:00+00', 18000, false, '2026-01-19 10:00:00+00', '2026-01-19 15:00:00+00'),
('b2000003-1464-4e5d-80c2-6b4dd2fbbc13', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-20 08:00:00+00', '2026-01-20 12:00:00+00', 14400, false, '2026-01-20 08:00:00+00', '2026-01-20 12:00:00+00'),
('b2000004-1464-4e5d-80c2-6b4dd2fbbc14', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-21 09:00:00+00', '2026-01-21 13:30:00+00', 16200, false, '2026-01-21 09:00:00+00', '2026-01-21 13:30:00+00'),
('b2000005-1464-4e5d-80c2-6b4dd2fbbc15', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-22 09:00:00+00', '2026-01-22 11:00:00+00', 7200, false, '2026-01-22 09:00:00+00', '2026-01-22 11:00:00+00'),
('b2000006-1464-4e5d-80c2-6b4dd2fbbc16', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-23 10:00:00+00', '2026-01-23 16:00:00+00', 21600, false, '2026-01-23 10:00:00+00', '2026-01-23 16:00:00+00'),
-- Deepak: 18, 20, 23
('b3000001-1464-4e5d-80c2-6b4dd2fbbc21', '02268f27-e994-49f4-bb87-634f7ffc437f', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-18 10:00:00+00', '2026-01-18 14:00:00+00', 14400, false, '2026-01-18 10:00:00+00', '2026-01-18 14:00:00+00'),
('b3000002-1464-4e5d-80c2-6b4dd2fbbc22', '02268f27-e994-49f4-bb87-634f7ffc437f', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-20 09:00:00+00', '2026-01-20 12:30:00+00', 12600, false, '2026-01-20 09:00:00+00', '2026-01-20 12:30:00+00'),
('b3000003-1464-4e5d-80c2-6b4dd2fbbc23', '02268f27-e994-49f4-bb87-634f7ffc437f', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-23 08:00:00+00', '2026-01-23 11:00:00+00', 10800, false, '2026-01-23 08:00:00+00', '2026-01-23 11:00:00+00'),
-- Monica: 18, 19, 20, 21, 22, 23, 24, 25
('b4000001-1464-4e5d-80c2-6b4dd2fbbc31', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-18 08:00:00+00', '2026-01-18 17:00:00+00', 32400, false, '2026-01-18 08:00:00+00', '2026-01-18 17:00:00+00'),
('b4000002-1464-4e5d-80c2-6b4dd2fbbc32', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-19 09:00:00+00', '2026-01-19 13:00:00+00', 14400, false, '2026-01-19 09:00:00+00', '2026-01-19 13:00:00+00'),
('b4000003-1464-4e5d-80c2-6b4dd2fbbc33', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-20 10:00:00+00', '2026-01-20 15:00:00+00', 18000, false, '2026-01-20 10:00:00+00', '2026-01-20 15:00:00+00'),
('b4000004-1464-4e5d-80c2-6b4dd2fbbc34', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-21 09:00:00+00', '2026-01-21 12:00:00+00', 10800, false, '2026-01-21 09:00:00+00', '2026-01-21 12:00:00+00'),
('b4000005-1464-4e5d-80c2-6b4dd2fbbc35', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-22 08:30:00+00', '2026-01-22 16:30:00+00', 28800, false, '2026-01-22 08:30:00+00', '2026-01-22 16:30:00+00'),
('b4000006-1464-4e5d-80c2-6b4dd2fbbc36', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-23 09:00:00+00', '2026-01-23 14:00:00+00', 18000, false, '2026-01-23 09:00:00+00', '2026-01-23 14:00:00+00'),
('b4000007-1464-4e5d-80c2-6b4dd2fbbc37', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-24 10:00:00+00', '2026-01-24 13:00:00+00', 10800, false, '2026-01-24 10:00:00+00', '2026-01-24 13:00:00+00'),
('b4000008-1464-4e5d-80c2-6b4dd2fbbc38', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '2026-01-25 09:00:00+00', '2026-01-25 11:30:00+00', 9000, false, '2026-01-25 09:00:00+00', '2026-01-25 11:30:00+00');

-- ============================================
-- 3. WORK LOGS – each ticket 1+ logs from assignee, within their sessions
-- ============================================
-- (id, ticket_id, user_id, work_session_id, start_time, end_time, duration, description, created_at, updated_at)
-- duration in seconds = end_time - start_time

INSERT INTO work_logs (id, ticket_id, user_id, work_session_id, start_time, end_time, duration, description, created_at, updated_at) VALUES
-- Sean's 5 tickets → sessions b1000001..b1000005
('c1000101-1464-4e5d-80c2-6b4dd2fbbc01', 'a1000001-1464-4e5d-80c2-6b4dd2fbbc01', '24e9b44a-6342-4813-bb60-05adeba998b4', 'b1000001-1464-4e5d-80c2-6b4dd2fbbc01', '2026-01-18 09:00:00+00', '2026-01-18 11:30:00+00', 9000, 'Hero and nav layout', '2026-01-18 11:30:00+00', '2026-01-18 11:30:00+00'),
('c1000102-1464-4e5d-80c2-6b4dd2fbbc02', 'a1000001-1464-4e5d-80c2-6b4dd2fbbc01', '24e9b44a-6342-4813-bb60-05adeba998b4', 'b1000001-1464-4e5d-80c2-6b4dd2fbbc01', '2026-01-18 11:30:00+00', '2026-01-18 12:30:00+00', 3600, 'Nav responsive tweaks', '2026-01-18 12:30:00+00', '2026-01-18 12:30:00+00'),
('c1000201-1464-4e5d-80c2-6b4dd2fbbc03', 'a1000002-1464-4e5d-80c2-6b4dd2fbbc02', '24e9b44a-6342-4813-bb60-05adeba998b4', 'b1000002-1464-4e5d-80c2-6b4dd2fbbc02', '2026-01-19 09:00:00+00', '2026-01-19 11:00:00+00', 7200, 'Product listing page', '2026-01-19 11:00:00+00', '2026-01-19 11:00:00+00'),
('c1000301-1464-4e5d-80c2-6b4dd2fbbc04', 'a1000003-1464-4e5d-80c2-6b4dd2fbbc03', '24e9b44a-6342-4813-bb60-05adeba998b4', 'b1000003-1464-4e5d-80c2-6b4dd2fbbc03', '2026-01-20 10:00:00+00', '2026-01-20 12:00:00+00', 7200, 'Disclaimer footer', '2026-01-20 12:00:00+00', '2026-01-20 12:00:00+00'),
('c1000401-1464-4e5d-80c2-6b4dd2fbbc05', 'a1000004-1464-4e5d-80c2-6b4dd2fbbc04', '24e9b44a-6342-4813-bb60-05adeba998b4', 'b1000004-1464-4e5d-80c2-6b4dd2fbbc04', '2026-01-21 08:30:00+00', '2026-01-21 10:30:00+00', 7200, 'Contact section', '2026-01-21 10:30:00+00', '2026-01-21 10:30:00+00'),
('c1000501-1464-4e5d-80c2-6b4dd2fbbc06', 'a1000005-1464-4e5d-80c2-6b4dd2fbbc05', '24e9b44a-6342-4813-bb60-05adeba998b4', 'b1000005-1464-4e5d-80c2-6b4dd2fbbc05', '2026-01-22 09:00:00+00', '2026-01-22 11:30:00+00', 9000, 'Prescriber login', '2026-01-22 11:30:00+00', '2026-01-22 11:30:00+00'),
-- Jesse's 7 tickets
('c2000101-1464-4e5d-80c2-6b4dd2fbbc11', 'a2000001-1464-4e5d-80c2-6b4dd2fbbc11', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', 'b2000001-1464-4e5d-80c2-6b4dd2fbbc11', '2026-01-18 09:30:00+00', '2026-01-18 12:00:00+00', 9000, 'Drug info component', '2026-01-18 12:00:00+00', '2026-01-18 12:00:00+00'),
('c2000201-1464-4e5d-80c2-6b4dd2fbbc12', 'a2000002-1464-4e5d-80c2-6b4dd2fbbc12', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', 'b2000001-1464-4e5d-80c2-6b4dd2fbbc11', '2026-01-18 13:00:00+00', '2026-01-18 15:30:00+00', 9000, 'Patient education content', '2026-01-18 15:30:00+00', '2026-01-18 15:30:00+00'),
('c2000301-1464-4e5d-80c2-6b4dd2fbbc13', 'a2000003-1464-4e5d-80c2-6b4dd2fbbc13', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', 'b2000002-1464-4e5d-80c2-6b4dd2fbbc12', '2026-01-19 10:00:00+00', '2026-01-19 12:30:00+00', 9000, 'Mobile responsive layout', '2026-01-19 12:30:00+00', '2026-01-19 12:30:00+00'),
('c2000401-1464-4e5d-80c2-6b4dd2fbbc14', 'a2000004-1464-4e5d-80c2-6b4dd2fbbc14', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', 'b2000002-1464-4e5d-80c2-6b4dd2fbbc12', '2026-01-19 12:30:00+00', '2026-01-19 15:00:00+00', 9000, 'WCAG audit', '2026-01-19 15:00:00+00', '2026-01-19 15:00:00+00'),
('c2000501-1464-4e5d-80c2-6b4dd2fbbc15', 'a2000005-1464-4e5d-80c2-6b4dd2fbbc15', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', 'b2000003-1464-4e5d-80c2-6b4dd2fbbc13', '2026-01-20 08:00:00+00', '2026-01-20 10:00:00+00', 7200, 'Clinical trials page', '2026-01-20 10:00:00+00', '2026-01-20 10:00:00+00'),
('c2000601-1464-4e5d-80c2-6b4dd2fbbc16', 'a2000006-1464-4e5d-80c2-6b4dd2fbbc16', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', 'b2000004-1464-4e5d-80c2-6b4dd2fbbc14', '2026-01-21 09:00:00+00', '2026-01-21 11:30:00+00', 9000, 'Coverage checker widget', '2026-01-21 11:30:00+00', '2026-01-21 11:30:00+00'),
('c2000701-1464-4e5d-80c2-6b4dd2fbbc17', 'a2000007-1464-4e5d-80c2-6b4dd2fbbc17', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', 'b2000005-1464-4e5d-80c2-6b4dd2fbbc15', '2026-01-22 09:00:00+00', '2026-01-22 10:30:00+00', 5400, 'Med info request form', '2026-01-22 10:30:00+00', '2026-01-22 10:30:00+00'),
-- Deepak's 3 tickets
('c3000101-1464-4e5d-80c2-6b4dd2fbbc21', 'a3000001-1464-4e5d-80c2-6b4dd2fbbc21', '02268f27-e994-49f4-bb87-634f7ffc437f', 'b3000001-1464-4e5d-80c2-6b4dd2fbbc21', '2026-01-18 10:00:00+00', '2026-01-18 12:30:00+00', 9000, 'Search and filters', '2026-01-18 12:30:00+00', '2026-01-18 12:30:00+00'),
('c3000201-1464-4e5d-80c2-6b4dd2fbbc22', 'a3000002-1464-4e5d-80c2-6b4dd2fbbc22', '02268f27-e994-49f4-bb87-634f7ffc437f', 'b3000002-1464-4e5d-80c2-6b4dd2fbbc22', '2026-01-20 09:00:00+00', '2026-01-20 11:00:00+00', 7200, 'Brand assets', '2026-01-20 11:00:00+00', '2026-01-20 11:00:00+00'),
('c3000301-1464-4e5d-80c2-6b4dd2fbbc23', 'a3000003-1464-4e5d-80c2-6b4dd2fbbc23', '02268f27-e994-49f4-bb87-634f7ffc437f', 'b3000002-1464-4e5d-80c2-6b4dd2fbbc22', '2026-01-20 11:00:00+00', '2026-01-20 12:30:00+00', 5400, 'FDA badge component', '2026-01-20 12:30:00+00', '2026-01-20 12:30:00+00'),
-- Monica's 10 tickets
('c4000101-1464-4e5d-80c2-6b4dd2fbbc31', 'a4000001-1464-4e5d-80c2-6b4dd2fbbc31', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', 'b4000001-1464-4e5d-80c2-6b4dd2fbbc31', '2026-01-18 08:00:00+00', '2026-01-18 10:30:00+00', 9000, 'Side effects section', '2026-01-18 10:30:00+00', '2026-01-18 10:30:00+00'),
('c4000201-1464-4e5d-80c2-6b4dd2fbbc32', 'a4000002-1464-4e5d-80c2-6b4dd2fbbc32', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', 'b4000001-1464-4e5d-80c2-6b4dd2fbbc31', '2026-01-18 10:30:00+00', '2026-01-18 13:00:00+00', 9000, 'Dosage component', '2026-01-18 13:00:00+00', '2026-01-18 13:00:00+00'),
('c4000301-1464-4e5d-80c2-6b4dd2fbbc33', 'a4000003-1464-4e5d-80c2-6b4dd2fbbc33', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', 'b4000001-1464-4e5d-80c2-6b4dd2fbbc31', '2026-01-18 13:00:00+00', '2026-01-18 15:00:00+00', 7200, 'Refill reminder', '2026-01-18 15:00:00+00', '2026-01-18 15:00:00+00'),
('c4000401-1464-4e5d-80c2-6b4dd2fbbc34', 'a4000004-1464-4e5d-80c2-6b4dd2fbbc34', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', 'b4000002-1464-4e5d-80c2-6b4dd2fbbc32', '2026-01-19 09:00:00+00', '2026-01-19 11:00:00+00', 7200, 'Newsletter signup', '2026-01-19 11:00:00+00', '2026-01-19 11:00:00+00'),
('c4000501-1464-4e5d-80c2-6b4dd2fbbc35', 'a4000005-1464-4e5d-80c2-6b4dd2fbbc35', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', 'b4000002-1464-4e5d-80c2-6b4dd2fbbc32', '2026-01-19 11:00:00+00', '2026-01-19 13:00:00+00', 7200, 'Cookie banner', '2026-01-19 13:00:00+00', '2026-01-19 13:00:00+00'),
('c4000601-1464-4e5d-80c2-6b4dd2fbbc36', 'a4000006-1464-4e5d-80c2-6b4dd2fbbc36', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', 'b4000003-1464-4e5d-80c2-6b4dd2fbbc33', '2026-01-20 10:00:00+00', '2026-01-20 12:30:00+00', 9000, 'PDF viewer', '2026-01-20 12:30:00+00', '2026-01-20 12:30:00+00'),
('c4000701-1464-4e5d-80c2-6b4dd2fbbc37', 'a4000007-1464-4e5d-80c2-6b4dd2fbbc37', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', 'b4000003-1464-4e5d-80c2-6b4dd2fbbc33', '2026-01-20 12:30:00+00', '2026-01-20 15:00:00+00', 9000, 'i18n setup', '2026-01-20 15:00:00+00', '2026-01-20 15:00:00+00'),
('c4000801-1464-4e5d-80c2-6b4dd2fbbc38', 'a4000008-1464-4e5d-80c2-6b4dd2fbbc38', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', 'b4000004-1464-4e5d-80c2-6b4dd2fbbc34', '2026-01-21 09:00:00+00', '2026-01-21 11:00:00+00', 7200, 'Analytics implementation', '2026-01-21 11:00:00+00', '2026-01-21 11:00:00+00'),
('c4000901-1464-4e5d-80c2-6b4dd2fbbc39', 'a4000009-1464-4e5d-80c2-6b4dd2fbbc39', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', 'b4000005-1464-4e5d-80c2-6b4dd2fbbc35', '2026-01-22 08:30:00+00', '2026-01-22 12:00:00+00', 12600, 'Security HIPAA review', '2026-01-22 12:00:00+00', '2026-01-22 12:00:00+00'),
('c4001001-1464-4e5d-80c2-6b4dd2fbbc3a', 'a4000010-1464-4e5d-80c2-6b4dd2fbbc3a', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', 'b4000006-1464-4e5d-80c2-6b4dd2fbbc36', '2026-01-23 09:00:00+00', '2026-01-23 11:00:00+00', 7200, 'Loading and error states', '2026-01-23 11:00:00+00', '2026-01-23 11:00:00+00');

-- ============================================
-- 4. UPDATE TICKETS – total_duration and last_worked_on from work_logs
-- ============================================
-- (In case no trigger exists; safe to run. ticket_details view will reflect correct totals.)

UPDATE tickets t SET
  total_duration = (SELECT COALESCE(SUM(wl.duration), 0) FROM work_logs wl WHERE wl.ticket_id = t.id),
  last_worked_on = (SELECT MAX(wl.end_time) FROM work_logs wl WHERE wl.ticket_id = t.id),
  updated_at = NOW()
WHERE t.project_id = '8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f';

-- ============================================
-- NOTE: project_members
-- ============================================
-- SEED_DATA_STARTER shows only Shawn in project_members for Project Walrus.
-- To have assignees (Jesse, Deepak, Monica) visible in the app, add them:
--
-- INSERT INTO project_members (project_id, user_id, role, is_online, joined_at, full_name, email) VALUES
--   ('8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'd89abfe8-bf43-4c08-8c6c-2d9cee8ace35', 'member', false, NOW(), 'Jesse Jackhood', 'jesse@email.com'),
--   ('8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', '02268f27-e994-49f4-bb87-634f7ffc437f', 'member', false, NOW(), NULL, 'deepak@email.com'),
--   ('8ba4fae0-1464-4e5d-80c2-6b4dd2fbbc2f', 'd4d398e1-9d0f-4e00-aa5d-249fffd83d84', 'member', false, NOW(), 'Monica Shonica', 'monica@email.com');
-- (Skip if they are already project members.)

-- ============================================
-- RE-ENABLE VALIDATION TRIGGER
-- ============================================
-- Re-enable the work_log_session_validation trigger after seeding is complete
ALTER TABLE work_logs ENABLE TRIGGER work_log_session_validation;
