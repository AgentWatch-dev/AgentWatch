create or replace function public.get_weekly_tenant_summary(tenant_id_param text)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with bounds as (
    select
      now() - interval '7 days' as period_start,
      now() as period_end
  ),
  weekly_logs as (
    select
      tenant_id,
      provider,
      model,
      prompt_tokens,
      completion_tokens,
      identified_risks
    from public.llm_request_logs, bounds
    where tenant_id = tenant_id_param
      and request_started_at >= bounds.period_start
      and request_started_at < bounds.period_end
  ),
  priced_logs as (
    select
      case
        when provider = 'openai' and model ilike 'gpt-5.4-mini%' then
          (prompt_tokens::numeric * 0.150000 / 1000000) + (completion_tokens::numeric * 0.600000 / 1000000)
        when provider = 'openai' and model ilike 'gpt-5.5%' then
          (prompt_tokens::numeric * 5.000000 / 1000000) + (completion_tokens::numeric * 15.000000 / 1000000)
        when provider = 'anthropic' and model ilike 'claude-sonnet-4.6%' then
          (prompt_tokens::numeric * 3.000000 / 1000000) + (completion_tokens::numeric * 15.000000 / 1000000)
        when provider = 'anthropic' and model ilike 'claude-opus-4.0%' then
          (prompt_tokens::numeric * 15.000000 / 1000000) + (completion_tokens::numeric * 75.000000 / 1000000)
        else
          ((prompt_tokens + completion_tokens)::numeric * 1.000000 / 1000000)
      end as estimated_cost
    from weekly_logs
  ),
  totals as (
    select
      coalesce(round(sum(estimated_cost), 6), 0)::numeric as total_cost,
      (select count(*)::integer from weekly_logs) as total_requests
    from priced_logs
  ),
  risk_counts as (
    select
      risk_tag,
      count(*)::integer as risk_count
    from weekly_logs
    cross join lateral unnest(identified_risks) as risk_tag
    where risk_tag <> ''
    group by risk_tag
  ),
  risk_json as (
    select coalesce(jsonb_object_agg(risk_tag, risk_count order by risk_tag), '{}'::jsonb) as risk_counts
    from risk_counts
  )
  select jsonb_build_object(
    'tenant_id', tenant_id_param,
    'period_start', bounds.period_start,
    'period_end', bounds.period_end,
    'total_cost', totals.total_cost,
    'total_requests', totals.total_requests,
    'risk_counts', risk_json.risk_counts
  )
  from bounds
  cross join totals
  cross join risk_json;
$$;

grant execute on function public.get_weekly_tenant_summary(text) to service_role;
