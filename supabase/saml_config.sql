-- =============================================================================
-- AgentWatch SAML/SSO & Auth Events — Run in Supabase SQL Editor
-- =============================================================================

-- Auth events table (SOC 2 audit trail for authentication)
CREATE TABLE IF NOT EXISTS public.auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  subject TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_events_tenant_created
  ON public.auth_events (tenant_id, created_at DESC);

ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_only ON public.auth_events
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.auth_events IS
  'SOC 2 audit trail for authentication events. Tracks login attempts, SSO events, session creation, and key management actions per tenant.';

-- Tenant SAML configuration
CREATE TABLE IF NOT EXISTS public.tenant_saml_config (
  tenant_id TEXT PRIMARY KEY,
  idp_sso_url TEXT NOT NULL,
  idp_certificate TEXT NOT NULL,
  sp_entity_id TEXT NOT NULL,
  sp_acs_url TEXT NOT NULL,
  name_id_format TEXT NOT NULL DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  attribute_mapping JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tenant_saml_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_only ON public.tenant_saml_config
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.tenant_saml_config IS
  'Per-tenant SAML/SSO configuration. Stores IdP metadata, SP settings, and attribute mapping for SAML-based single sign-on.';

-- RPC to get tenant SAML config
-- Parameter matches callRpc: tenant_id_param
CREATE OR REPLACE FUNCTION public.get_tenant_saml_config(tenant_id_param TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT JSONB_BUILD_OBJECT(
      'tenant_id', sc.tenant_id,
      'idp_sso_url', sc.idp_sso_url,
      'idp_certificate', sc.idp_certificate,
      'sp_entity_id', sc.sp_entity_id,
      'sp_acs_url', sc.sp_acs_url,
      'name_id_format', sc.name_id_format,
      'attribute_mapping', sc.attribute_mapping,
      'enabled', sc.enabled
    ) FROM public.tenant_saml_config sc WHERE sc.tenant_id = tenant_id_param),
    NULL::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_saml_config(text) TO service_role;

-- RPC to upsert tenant SAML config
CREATE OR REPLACE FUNCTION public.upsert_tenant_saml_config(
  p_tenant_id TEXT,
  p_idp_sso_url TEXT,
  p_idp_certificate TEXT,
  p_sp_entity_id TEXT,
  p_sp_acs_url TEXT,
  p_name_id_format TEXT DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  p_attribute_mapping JSONB DEFAULT '{}'::jsonb,
  p_enabled BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.tenant_saml_config (
    tenant_id, idp_sso_url, idp_certificate, sp_entity_id, sp_acs_url,
    name_id_format, attribute_mapping, enabled, updated_at
  )
  VALUES (
    p_tenant_id, p_idp_sso_url, p_idp_certificate, p_sp_entity_id, p_sp_acs_url,
    p_name_id_format, p_attribute_mapping, p_enabled, NOW()
  )
  ON CONFLICT (tenant_id)
  DO UPDATE SET
    idp_sso_url = EXCLUDED.idp_sso_url,
    idp_certificate = EXCLUDED.idp_certificate,
    sp_entity_id = EXCLUDED.sp_entity_id,
    sp_acs_url = EXCLUDED.sp_acs_url,
    name_id_format = EXCLUDED.name_id_format,
    attribute_mapping = EXCLUDED.attribute_mapping,
    enabled = EXCLUDED.enabled,
    updated_at = NOW();

  RETURN JSONB_BUILD_OBJECT('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_tenant_saml_config(text, text, text, text, text, text, jsonb, boolean) TO service_role;

-- RPC to delete tenant SAML config
CREATE OR REPLACE FUNCTION public.delete_tenant_saml_config(p_tenant_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.tenant_saml_config WHERE tenant_id = p_tenant_id;
  RETURN JSONB_BUILD_OBJECT('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_tenant_saml_config(text) TO service_role;
