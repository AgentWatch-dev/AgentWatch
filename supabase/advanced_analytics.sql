-- =============================================================================
-- AgentWatch Advanced Analytics RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_analytics_advanced(
  tenant_id_param text,
  days_back integer DEFAULT 14
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
      l.request_started_at,
      l.upstream_ttfb_ms,
      ((l.prompt_tokens::numeric * coalesce(p.prompt_cost_per_million, 1.0) / 1000000) + 
       (l.completion_tokens::numeric * coalesce(p.completion_cost_per_million, 1.0) / 1000000)) as cost_usd,
       date(l.request_started_at) as req_date
    from public.llm_request_logs l
    left join public.model_pricing p on l.provider = p.provider and l.model ilike p.model_pattern
    where l.tenant_id = tenant_id_param
      and l.request_started_at >= now() - (days_back || ' days')::interval
  ),
  cost_by_model as (
    select
      model,
      sum(cost_usd) as cost
    from priced_logs
    group by model
    order by cost desc
  ),
  latency_by_provider as (
    select
      provider,
      avg(upstream_ttfb_ms) as avgLatency
    from priced_logs
    where upstream_ttfb_ms is not null
    group by provider
  ),
  tokens_totals as (
    select
      sum(prompt_tokens) as promptTokens,
      sum(completion_tokens) as completionTokens
    from priced_logs
  ),
  traffic_by_date as (
    select
      req_date as date,
      count(*) as requests
    from priced_logs
    group by req_date
    order by req_date asc
  )
  select jsonb_build_object(
    'costByModel', coalesce((select jsonb_agg(row_to_json(c)) from cost_by_model c), '[]'::jsonb),
    'latencyByProvider', coalesce((select jsonb_agg(row_to_json(l)) from latency_by_provider l), '[]'::jsonb),
    'tokens', coalesce((select jsonb_build_object('promptTokens', promptTokens, 'completionTokens', completionTokens) from tokens_totals), '{"promptTokens":0,"completionTokens":0}'::jsonb),
    'traffic', coalesce((select jsonb_agg(row_to_json(t)) from traffic_by_date t), '[]'::jsonb)
  );
$$;

grant execute on function public.get_dashboard_analytics_advanced(text, integer) to service_role;
