-- =============================================================================
-- AgentWatch Retention Policy — Run in Supabase SQL Editor
-- =============================================================================

-- 1. Ensure the pg_cron extension is enabled:
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule the purge job (idempotent — safe to re-run)
SELECT cron.schedule(
  'purge-old-logs',
  '0 2 * * *',  -- 2am daily
  $$SELECT public.purge_old_logs()$$
)
WHERE NOT EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'purge-old-logs'
);

-- Note: The purge_old_logs() function was created in hardening.sql
-- and deletes records older than 90 days.
