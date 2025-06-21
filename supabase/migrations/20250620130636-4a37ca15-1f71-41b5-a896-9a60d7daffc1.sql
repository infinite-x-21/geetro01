
-- Enable the pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup function to run daily at 5 AM
SELECT cron.schedule(
  'cleanup-expired-messages',
  '0 5 * * *',
  'SELECT public.cleanup_expired_messages();'
);