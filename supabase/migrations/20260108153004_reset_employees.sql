-- Reset employees and related tables to allow fresh login
-- Data will be recreated when users log in via trigger

TRUNCATE TABLE pdi_attachments CASCADE;
TRUNCATE TABLE pdi_comments CASCADE;
TRUNCATE TABLE pdi_goals CASCADE;
TRUNCATE TABLE pdi_logs CASCADE;
TRUNCATE TABLE pdis CASCADE;
TRUNCATE TABLE feedbacks CASCADE;
TRUNCATE TABLE devices CASCADE;
TRUNCATE TABLE employees_contact CASCADE;
TRUNCATE TABLE employees_contracts CASCADE;
TRUNCATE TABLE time_off_balances CASCADE;
TRUNCATE TABLE time_off_requests CASCADE;
TRUNCATE TABLE profiler_history CASCADE;
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE organization_members CASCADE;
TRUNCATE TABLE employees CASCADE;
