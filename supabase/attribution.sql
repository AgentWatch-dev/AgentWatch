-- =============================================================================
-- AgentWatch Attribution Columns — Run in Supabase SQL Editor
-- =============================================================================
-- Adds project and team attribution fields for per-team/project spend tracking.

ALTER TABLE public.llm_request_logs
  ADD COLUMN IF NOT EXISTS project TEXT,
  ADD COLUMN IF NOT EXISTS team TEXT;

-- Index for fast per-project and per-team aggregation queries
CREATE INDEX IF NOT EXISTS idx_logs_project ON public.llm_request_logs (project) WHERE project IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_team    ON public.llm_request_logs (team) WHERE team IS NOT NULL;

-- Composite index for the killer query: "spend by team+project in date range"
CREATE INDEX IF NOT EXISTS idx_logs_team_project_date
  ON public.llm_request_logs (team, project, request_started_at DESC)
  WHERE team IS NOT NULL;
