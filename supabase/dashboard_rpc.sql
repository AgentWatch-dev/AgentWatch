-- =============================================================================
-- AgentWatch Dashboard RPCs — Run in Supabase SQL Editor
-- =============================================================================

-- 1. Session spend table (sortable by team/project/model)
CREATE OR REPLACE FUNCTION public.get_dashboard_sessions(
  tenant_id_param text,
  days_back integer DEFAULT 7
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with priced_logs as (
    select
      l.session_id,
      l.team,
      l.provider,
      l.model,
      l.prompt_tokens,
      l.completion_tokens,
      l.cumulative_tokens_in_session,
      l.request_started_at,
      l.iteration_index,
      ((l.prompt_tokens::numeric * coalesce(p.prompt_cost_per_million, 1.0) / 1000000) + 
       (l.completion_tokens::numeric * coalesce(p.completion_cost_per_million, 1.0) / 1000000)) as cost_usd
    from public.llm_request_logs l
    left join public.model_pricing p on l.provider = p.provider and l.model ilike p.model_pattern
    where l.tenant_id = tenant_id_param
      and l.request_started_at >= now() - (days_back || ' days')::interval
      and l.session_id is not null
  ),
  session_data as (
    select
      session_id,
      max(team) as team,
      max(provider) as provider,
      max(model) as model,
      count(*) as request_count,
      sum(prompt_tokens) as total_prompt_tokens,
      sum(completion_tokens) as total_completion_tokens,
      sum(prompt_tokens + completion_tokens) as total_tokens,
      max(cumulative_tokens_in_session) as cumulative_tokens,
      min(request_started_at) as first_request,
      max(request_started_at) as last_request,
      max(iteration_index) as max_iteration,
      sum(cost_usd) as estimated_cost_usd
    from priced_logs
    group by session_id
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'session_id', sd.session_id,
      'team', sd.team,
      'provider', sd.provider,
      'model', sd.model,
      'request_count', sd.request_count,
      'total_prompt_tokens', sd.total_prompt_tokens,
      'total_completion_tokens', sd.total_completion_tokens,
      'total_tokens', sd.total_tokens,
      'cumulative_tokens', sd.cumulative_tokens,
      'estimated_cost_usd', round(sd.estimated_cost_usd, 6),
      'first_request', sd.first_request,
      'last_request', sd.last_request,
      'max_iteration', sd.max_iteration
    ) order by sd.estimated_cost_usd desc
  ), '[]'::jsonb)
  from session_data sd;
$$;

grant execute on function public.get_dashboard_sessions(text, integer) to service_role;

-- 2. Anomaly alert feed
CREATE OR REPLACE FUNCTION public.get_dashboard_anomalies(
  tenant_id_param text,
  days_back integer DEFAULT 7
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with session_iterations as (
    select
      session_id,
      team,
      model,
      iteration_index,
      prompt_tokens,
      request_started_at,
      lag(prompt_tokens) over (partition by session_id order by iteration_index) as prev_prompt_tokens
    from public.llm_request_logs
    where tenant_id = tenant_id_param
      and request_started_at >= now() - (days_back || ' days')::interval
      and session_id is not null
      and iteration_index is not null
  ),
  anomalies as (
    select
      si.session_id,
      si.team,
      si.model,
      si.iteration_index,
      si.prompt_tokens,
      si.prev_prompt_tokens,
      si.request_started_at,
      case
        when si.prev_prompt_tokens > 0 then
          round((si.prompt_tokens::numeric / si.prev_prompt_tokens), 2)
        else 0
      end as growth_ratio
    from session_iterations si
    where si.prev_prompt_tokens is not null
      and si.prev_prompt_tokens > 0
      and (si.prompt_tokens::numeric / si.prev_prompt_tokens) > 1.4
  ),
  consecutive_flags as (
    select
      a.session_id,
      a.team,
      a.model,
      a.iteration_index,
      a.prompt_tokens,
      a.growth_ratio,
      a.request_started_at,
      (
        select count(*)
        from anomalies a2
        where a2.session_id = a.session_id
          and a2.iteration_index between a.iteration_index - 2 and a.iteration_index
          and a2.growth_ratio > 1.4
      ) as consecutive_count
    from anomalies a
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'session_id', cf.session_id,
      'team', cf.team,
      'model', cf.model,
      'iteration_index', cf.iteration_index,
      'prompt_tokens', cf.prompt_tokens,
      'growth_ratio', cf.growth_ratio,
      'request_started_at', cf.request_started_at,
      'alert_type', case when cf.consecutive_count >= 3 then 'runaway_detected' else 'growth_warning' end
    ) order by cf.request_started_at desc
  ), '[]'::jsonb)
  from consecutive_flags cf
  where cf.consecutive_count >= 2;
$$;

grant execute on function public.get_dashboard_anomalies(text, integer) to service_role;

-- 3. Monthly spend trend (current vs previous month)
CREATE OR REPLACE FUNCTION public.get_dashboard_spend_trend(
  tenant_id_param text
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with month_data as (
    select
      date_trunc('month', l.request_started_at) as month,
      l.prompt_tokens,
      l.completion_tokens,
      ((l.prompt_tokens::numeric * coalesce(p.prompt_cost_per_million, 1.0) / 1000000) + 
       (l.completion_tokens::numeric * coalesce(p.completion_cost_per_million, 1.0) / 1000000)) as cost_usd
    from public.llm_request_logs l
    left join public.model_pricing p on l.provider = p.provider and l.model ilike p.model_pattern
    where l.tenant_id = tenant_id_param
      and l.request_started_at >= date_trunc('month', now() - interval '12 months')
  ),
  monthly_totals as (
    select
      month,
      sum(cost_usd) as total_cost,
      count(*) as total_requests
    from month_data
    group by month
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'month', to_char(mt.month, 'YYYY-MM'),
      'total_cost', round(mt.total_cost, 4),
      'total_requests', mt.total_requests
    ) order by mt.month
  ), '[]'::jsonb)
  from monthly_totals mt;
$$;

grant execute on function public.get_dashboard_spend_trend(text) to service_role;

-- 4. Provider breakdown
CREATE OR REPLACE FUNCTION public.get_dashboard_provider_breakdown(
  tenant_id_param text,
  days_back integer DEFAULT 30
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with priced_logs as (
    select
      l.provider,
      l.model,
      l.prompt_tokens,
      l.completion_tokens,
      l.total_latency_ms,
      l.proxy_overhead_ms,
      l.error,
      ((l.prompt_tokens::numeric * coalesce(p.prompt_cost_per_million, 1.0) / 1000000) + 
       (l.completion_tokens::numeric * coalesce(p.completion_cost_per_million, 1.0) / 1000000)) as cost_usd
    from public.llm_request_logs l
    left join public.model_pricing p on l.provider = p.provider and l.model ilike p.model_pattern
    where l.tenant_id = tenant_id_param
      and l.request_started_at >= now() - (days_back || ' days')::interval
  ),
  provider_data as (
    select
      provider,
      max(model) as model,
      count(*) as request_count,
      sum(prompt_tokens) as total_prompt_tokens,
      sum(completion_tokens) as total_completion_tokens,
      avg(total_latency_ms) as avg_latency_ms,
      avg(proxy_overhead_ms) as avg_proxy_overhead_ms,
      sum(case when error is not null then 1 else 0 end) as error_count,
      sum(cost_usd) as estimated_cost_usd
    from priced_logs
    group by provider
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'provider', pd.provider,
      'model', pd.model,
      'request_count', pd.request_count,
      'total_prompt_tokens', pd.total_prompt_tokens,
      'total_completion_tokens', pd.total_completion_tokens,
      'avg_latency_ms', round(pd.avg_latency_ms::numeric, 2),
      'avg_proxy_overhead_ms', round(pd.avg_proxy_overhead_ms::numeric, 2),
      'error_count', pd.error_count,
      'estimated_cost_usd', round(pd.estimated_cost_usd, 4)
    ) order by pd.estimated_cost_usd desc
  ), '[]'::jsonb)
  from provider_data pd;
$$;

grant execute on function public.get_dashboard_provider_breakdown(text, integer) to service_role;

-- 4b. Team Spend breakdown
CREATE OR REPLACE FUNCTION public.get_dashboard_team_spend(
  tenant_id_param text,
  days_back integer DEFAULT 30
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with priced_logs as (
    select
      coalesce(l.team, 'default') as team,
      l.prompt_tokens,
      l.completion_tokens,
      ((l.prompt_tokens::numeric * coalesce(p.prompt_cost_per_million, 1.0) / 1000000) + 
       (l.completion_tokens::numeric * coalesce(p.completion_cost_per_million, 1.0) / 1000000)) as cost_usd
    from public.llm_request_logs l
    left join public.model_pricing p on l.provider = p.provider and l.model ilike p.model_pattern
    where l.tenant_id = tenant_id_param
      and l.request_started_at >= now() - (days_back || ' days')::interval
  ),
  team_data as (
    select
      team as team_name,
      count(*) as request_count,
      sum(prompt_tokens) as total_prompt_tokens,
      sum(completion_tokens) as total_completion_tokens,
      sum(cost_usd) as estimated_cost_usd
    from priced_logs
    group by team
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'team', td.team_name,
      'request_count', td.request_count,
      'total_tokens', td.total_prompt_tokens + td.total_completion_tokens,
      'estimated_cost_usd', round(td.estimated_cost_usd, 4)
    ) order by td.estimated_cost_usd desc
  ), '[]'::jsonb)
  from team_data td;
$$;

grant execute on function public.get_dashboard_team_spend(text, integer) to service_role;

-- 5. Dashboard summary stats
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
  tenant_id_param text,
  days_back integer DEFAULT 30
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with priced_logs as (
    select
      l.session_id,
      l.team,
      l.provider,
      l.prompt_tokens,
      l.completion_tokens,
      l.error,
      ((l.prompt_tokens::numeric * coalesce(p.prompt_cost_per_million, 1.0) / 1000000) + 
       (l.completion_tokens::numeric * coalesce(p.completion_cost_per_million, 1.0) / 1000000)) as cost_usd
    from public.llm_request_logs l
    left join public.model_pricing p on l.provider = p.provider and l.model ilike p.model_pattern
    where l.tenant_id = tenant_id_param
      and l.request_started_at >= now() - (days_back || ' days')::interval
  ),
  stats as (
    select
      count(*) as total_requests,
      count(distinct session_id) as total_sessions,
      count(distinct team) as total_teams,
      count(distinct provider) as total_providers,
      sum(prompt_tokens + completion_tokens) as total_tokens,
      sum(case when error is not null then 1 else 0 end) as error_count,
      sum(cost_usd) as total_cost_usd
    from priced_logs
  )
  select jsonb_build_object(
    'total_requests', s.total_requests,
    'total_sessions', s.total_sessions,
    'total_teams', s.total_teams,
    'total_providers', s.total_providers,
    'total_tokens', s.total_tokens,
    'total_cost', coalesce(round(s.total_cost_usd, 4), 0),
    'error_count', s.error_count,
    'error_rate', case when s.total_requests > 0 then round((s.error_count::numeric / s.total_requests) * 100, 2) else 0 end
  )
  from stats s;
$$;

grant execute on function public.get_dashboard_summary(text, integer) to service_role;

-- 6. Create Developer Key
CREATE OR REPLACE FUNCTION public.create_developer_key(
  p_tenant_id text,
  p_name text,
  p_role text,
  p_team_id text,
  p_key_prefix text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.developer_keys (tenant_id, name, role, team_id, key_prefix)
  values (p_tenant_id, p_name, p_role, p_team_id, p_key_prefix)
  returning id into v_id;

  insert into public.audit_logs (tenant_id, action, details)
  values (
    p_tenant_id, 
    'KEY_CREATED', 
    jsonb_build_object('key_id', v_id, 'name', p_name, 'role', p_role, 'team_id', p_team_id, 'key_prefix', p_key_prefix)
  );

  return jsonb_build_object('success', true, 'id', v_id);
end;
$$;

grant execute on function public.create_developer_key(text, text, text, text, text) to service_role;

-- 7. Get Dashboard Keys
CREATE OR REPLACE FUNCTION public.get_dashboard_keys(
  tenant_id_param text
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'role', role,
      'team_id', team_id,
      'key_prefix', key_prefix,
      'created_at', created_at
    ) order by created_at desc
  ), '[]'::jsonb)
  from public.developer_keys
  where tenant_id = tenant_id_param;
$$;

grant execute on function public.get_dashboard_keys(text) to service_role;

-- 8. Revoke Developer Key
CREATE OR REPLACE FUNCTION public.revoke_developer_key(
  p_tenant_id text,
  p_key_prefix text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  delete from public.developer_keys
  where tenant_id = p_tenant_id and key_prefix = p_key_prefix
  returning id into v_id;

  if v_id is not null then
    insert into public.audit_logs (tenant_id, action, details)
    values (
      p_tenant_id, 
      'KEY_REVOKED', 
      jsonb_build_object('key_prefix', p_key_prefix)
    );
  end if;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.revoke_developer_key(text, text) to service_role;

-- 9. Get Audit Logs
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  tenant_id_param text
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'action', action,
      'details', details,
      'created_at', created_at
    ) order by created_at desc
  ), '[]'::jsonb)
  from public.audit_logs
  where tenant_id = tenant_id_param;
$$;

grant execute on function public.get_audit_logs(text) to service_role;

-- 10. Explicit Team Management
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL default now(),
  UNIQUE(tenant_id, name)
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_only ON public.teams
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.create_team(
  p_tenant_id text,
  p_name text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.teams (tenant_id, name)
  values (p_tenant_id, p_name)
  on conflict (tenant_id, name) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.teams where tenant_id = p_tenant_id and name = p_name;
  else
    insert into public.audit_logs (tenant_id, action, details)
    values (
      p_tenant_id, 
      'TEAM_CREATED', 
      jsonb_build_object('team_id', v_id, 'name', p_name)
    );
  end if;

  return jsonb_build_object('success', true, 'id', v_id);
end;
$$;

grant execute on function public.create_team(text, text) to service_role;

CREATE OR REPLACE FUNCTION public.get_dashboard_team_list(
  tenant_id_param text
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'created_at', created_at
    ) order by name asc
  ), '[]'::jsonb)
  from public.teams
  where tenant_id = tenant_id_param;
$$;

grant execute on function public.get_dashboard_team_list(text) to service_role;

CREATE OR REPLACE FUNCTION public.delete_team(
  p_tenant_id text,
  p_name text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  delete from public.teams
  where tenant_id = p_tenant_id and name = p_name
  returning id into v_id;

  if v_id is not null then
    insert into public.audit_logs (tenant_id, action, details)
    values (
      p_tenant_id, 
      'TEAM_DELETED', 
      jsonb_build_object('team_id', v_id, 'name', p_name)
    );
  end if;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.delete_team(text, text) to service_role;

-- 11. Request volume by hour (last 24 hours)
-- Parameter matches callRpc: tenant_id_param
CREATE OR REPLACE FUNCTION public.get_request_volume_by_hour(tenant_id_param TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH hourly AS (
    SELECT
      date_trunc('hour', request_started_at) AS hour,
      COUNT(*) AS count
    FROM public.llm_request_logs
    WHERE tenant_id = tenant_id_param
      AND request_started_at >= NOW() - INTERVAL '24 hours'
    GROUP BY date_trunc('hour', request_started_at)
  ),
  full_hours AS (
    SELECT generate_series(
      date_trunc('hour', NOW() - INTERVAL '23 hours'),
      date_trunc('hour', NOW()),
      INTERVAL '1 hour'
    ) AS hour
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'hour', TO_CHAR(fh.hour, 'YYYY-MM-DD"T"HH24:00:00Z'),
      'count', COALESCE(h.count, 0)
    ) ORDER BY fh.hour
  ), '[]'::jsonb)
  FROM full_hours fh
  LEFT JOIN hourly h ON h.hour = fh.hour;
$$;

GRANT EXECUTE ON FUNCTION public.get_request_volume_by_hour(text) TO service_role;
