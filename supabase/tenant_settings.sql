-- =============================================================================
-- AgentWatch Tenant Settings Schema & Danger Zone RPCs
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_settings (
  tenant_id TEXT PRIMARY KEY,
  alert_email TEXT,
  alert_threshold_pct NUMERIC DEFAULT 80,
  data_retention_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_only ON public.tenant_settings
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Upsert settings
CREATE OR REPLACE FUNCTION public.upsert_tenant_settings(
  p_tenant_id TEXT,
  p_alert_email TEXT,
  p_alert_threshold_pct NUMERIC,
  p_data_retention_days INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  INSERT INTO public.tenant_settings (tenant_id, alert_email, alert_threshold_pct, data_retention_days, updated_at)
  VALUES (p_tenant_id, p_alert_email, p_alert_threshold_pct, p_data_retention_days, NOW())
  ON CONFLICT (tenant_id)
  DO UPDATE SET
    alert_email = EXCLUDED.alert_email,
    alert_threshold_pct = EXCLUDED.alert_threshold_pct,
    data_retention_days = EXCLUDED.data_retention_days,
    updated_at = NOW();
END;
$$;

-- Get settings
CREATE OR REPLACE FUNCTION public.get_tenant_settings(p_tenant_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_res JSONB;
BEGIN
  SELECT jsonb_build_object(
    'alert_email', alert_email,
    'alert_threshold_pct', alert_threshold_pct,
    'data_retention_days', data_retention_days
  ) INTO v_res
  FROM public.tenant_settings
  WHERE tenant_id = p_tenant_id;
  
  IF v_res IS NULL THEN
    v_res := jsonb_build_object(
      'alert_email', '',
      'alert_threshold_pct', 80,
      'data_retention_days', 30
    );
  END IF;
  
  RETURN v_res;
END;
$$;

-- Reset workspace (deletes all logs and analytics)
CREATE OR REPLACE FUNCTION public.reset_workspace(p_tenant_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_tenant_id IS NULL OR length(p_tenant_id) = 0 THEN
    RAISE EXCEPTION 'tenant_id is required';
  END IF;
  DELETE FROM public.llm_request_logs WHERE tenant_id = p_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_workspace(text) TO service_role;

-- Delete workspace (deletes EVERYTHING for the tenant)
CREATE OR REPLACE FUNCTION public.delete_workspace(p_tenant_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_tenant_id IS NULL OR length(p_tenant_id) = 0 THEN
    RAISE EXCEPTION 'tenant_id is required';
  END IF;
  DELETE FROM public.llm_request_logs WHERE tenant_id = p_tenant_id;
  DELETE FROM public.developer_keys WHERE tenant_id = p_tenant_id;
  DELETE FROM public.audit_logs WHERE tenant_id = p_tenant_id;
  DELETE FROM public.tenant_settings WHERE tenant_id = p_tenant_id;
  
  -- If teams, budgets, etc exist, drop them if they exist
  DELETE FROM public.team_budgets WHERE tenant_id = p_tenant_id;
  DELETE FROM public.teams WHERE tenant_id = p_tenant_id;
  DELETE FROM public.tenant_rules WHERE tenant_id = p_tenant_id;
  DELETE FROM public.api_access_log WHERE tenant_id = p_tenant_id;
  DELETE FROM public.tenant_saml_config WHERE tenant_id = p_tenant_id;
  DELETE FROM public.compliance_reports WHERE tenant_id = p_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_workspace(text) TO service_role;
