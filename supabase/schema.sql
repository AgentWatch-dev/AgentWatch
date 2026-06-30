-- =============================================================================
-- AgentWatch Database Schema — Run in Supabase SQL Editor
-- =============================================================================
-- This file is idempotent — safe to run multiple times.

create extension if not exists pgcrypto;

-- ===========================================================================
-- llm_request_logs — Core telemetry table
-- ===========================================================================
create table if not exists public.llm_request_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  provider text not null,
  upstream_path text not null,
  model text,
  request_started_at timestamptz not null,
  response_status integer,
  is_stream boolean not null default false,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer generated always as (prompt_tokens + completion_tokens) stored,
  upstream_ttfb_ms integer,
  total_latency_ms integer not null default 0,
  proxy_overhead_ms integer not null default 0,
  upstream_request_id text,
  error text,
  identified_risks text[] not null default '{}'::text[],
  project text,
  team text,
  session_id text,
  iteration_index integer,
  cumulative_tokens_in_session integer,
  created_at timestamptz not null default now()
);

-- Add columns if table already exists (for upgrades)
ALTER TABLE public.llm_request_logs ADD COLUMN IF NOT EXISTS proxy_overhead_ms integer not null default 0;
ALTER TABLE public.llm_request_logs ADD COLUMN IF NOT EXISTS identified_risks text[] not null default '{}'::text[];
ALTER TABLE public.llm_request_logs ADD COLUMN IF NOT EXISTS project text;
ALTER TABLE public.llm_request_logs ADD COLUMN IF NOT EXISTS team text;
ALTER TABLE public.llm_request_logs ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE public.llm_request_logs ADD COLUMN IF NOT EXISTS iteration_index integer;
ALTER TABLE public.llm_request_logs ADD COLUMN IF NOT EXISTS cumulative_tokens_in_session integer;

-- Indexes
CREATE INDEX IF NOT EXISTS llm_request_logs_tenant_started_idx
  ON public.llm_request_logs (tenant_id, request_started_at desc);

CREATE INDEX IF NOT EXISTS llm_request_logs_provider_model_idx
  ON public.llm_request_logs (provider, model);

CREATE INDEX IF NOT EXISTS idx_logs_project ON public.llm_request_logs (project) WHERE project IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_team ON public.llm_request_logs (team) WHERE team IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_team_project_date
  ON public.llm_request_logs (team, project, request_started_at DESC)
  WHERE team IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_session_id ON public.llm_request_logs (session_id) WHERE session_id IS NOT NULL;

ALTER TABLE public.llm_request_logs enable row level security;

-- ===========================================================================
-- developer_keys — API key management
-- ===========================================================================
create table if not exists public.developer_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  name text not null,
  role text not null check (role in ('admin', 'developer')),
  team_id text,
  key_prefix text not null,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS developer_keys_tenant_idx
  ON public.developer_keys (tenant_id);

ALTER TABLE public.developer_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_only ON public.developer_keys
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ===========================================================================
-- audit_logs — Security audit trail
-- ===========================================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS audit_logs_tenant_created_idx
  ON public.audit_logs (tenant_id, created_at desc);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_only ON public.audit_logs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
