-- AgentWatch SLA Monitoring
-- Tracks uptime records for SLA reporting and breach detection.

create table if not exists sla_records (
  id bigint generated always as identity primary key,
  tenant_id text not null,
  status text not null check (status in ('up', 'down', 'degraded')),
  latency_ms numeric not null default 0,
  response_status integer,
  error text,
  created_at timestamptz not null default now()
);

alter table sla_records enable row level security;

create policy "service_role only" on sla_records
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists idx_sla_records_tenant_created on sla_records (tenant_id, created_at desc);

create or replace function get_sla_records(tenant_id_param text, days_back integer default 30)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select coalesce(json_agg(row_to_json(r)), '[]'::json)
  into result
  from (
    select
      created_at as "timestamp",
      status,
      latency_ms as "latencyMs",
      response_status as "statusCode",
      error
    from sla_records
    where tenant_id = tenant_id_param
      and created_at >= now() - (days_back || ' days')::interval
    order by created_at asc
  ) r;

  return result;
end;
$$;
