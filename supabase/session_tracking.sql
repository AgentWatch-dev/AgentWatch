-- =============================================================================
-- AgentWatch Session Tracking — Run in Supabase SQL Editor
-- =============================================================================

ALTER TABLE public.llm_request_logs
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS iteration_index INTEGER,
  ADD COLUMN IF NOT EXISTS cumulative_tokens_in_session INTEGER;

CREATE INDEX IF NOT EXISTS idx_logs_session_id ON public.llm_request_logs (session_id) WHERE session_id IS NOT NULL;
