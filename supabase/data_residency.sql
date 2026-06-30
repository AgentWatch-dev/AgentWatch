-- =============================================================================
-- AgentWatch Data Residency — Run in Supabase SQL Editor
-- =============================================================================

-- Tenant region configuration
CREATE TABLE IF NOT EXISTS public.tenant_residency (
  tenant_id TEXT PRIMARY KEY,
  region TEXT NOT NULL DEFAULT 'global' CHECK (region IN ('global', 'eu', 'us', 'apac')),
  data_residency_enforced BOOLEAN NOT NULL DEFAULT false,
  eu_fallback_allowed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tenant_residency ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_only ON public.tenant_residency
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.tenant_residency IS
  'Per-tenant data residency configuration. region: the preferred data residency region. data_residency_enforced: if true, routing logic will attempt to keep data within the region. eu_fallback_allowed: if true, EU tenants may fall back to non-EU providers if the EU endpoint is unavailable (with explicit audit log). IMPORTANT: This controls routing preferences only. Cloudflare edge processing and Supabase replication are governed by their own infrastructure configuration, not by this table.';

-- RPC to get tenant residency config
CREATE OR REPLACE FUNCTION public.get_tenant_residency(tenant_id_param text)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT JSONB_BUILD_OBJECT(
      'tenant_id', r.tenant_id,
      'region', r.region,
      'data_residency_enforced', r.data_residency_enforced,
      'eu_fallback_allowed', r.eu_fallback_allowed
    ) FROM public.tenant_residency r WHERE r.tenant_id = tenant_id_param),
    JSONB_BUILD_OBJECT(
      'tenant_id', tenant_id_param,
      'region', 'global',
      'data_residency_enforced', false,
      'eu_fallback_allowed', false
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_residency(text) TO service_role;
