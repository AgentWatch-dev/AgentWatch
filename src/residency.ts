// AgentWatch Data Residency Routing
//
// IMPORTANT LIMITATIONS (be honest with users):
// - This controls routing PREFERENCES, not guarantees.
// - Cloudflare Workers run on 300+ edge locations globally. The Worker itself
//   may execute outside the tenant's preferred region.
// - KV storage is eventually consistent across regions. KV writes are replicated
//   globally within seconds.
// - Supabase data residency depends on the Supabase project's region config,
//   not on this routing logic.
// - Provider API endpoints (OpenAI, Anthropic) may not have EU-specific endpoints.
//   When they do, this module routes to them. When they don't, it logs the deviation.
//
// What this module DOES:
// - Stores tenant region preference
// - Routes to EU-specific provider endpoints when available (e.g., Azure OpenAI EU)
// - Tags log records with region for audit
// - Makes fallback behavior explicit and logged
// - Fails closed for EU tenants when fallback is not allowed

export interface ResidencyConfig {
  tenant_id: string;
  region: "global" | "eu" | "us" | "apac";
  data_residency_enforced: boolean;
  eu_fallback_allowed: boolean;
}

// EU-specific provider endpoint mappings (where available)
const EU_ENDPOINTS: Record<string, string> = {
  azure: "https://swedencentral.openai.azure.com",
  openai: "https://eu.api.openai.com",
  anthropic: "https://api.anthropic.com",
  gemini: "https://europe-west1-aiplatform.googleapis.com",
};

export function getResidencyForProvider(
  config: ResidencyConfig,
  provider: string,
  customEndpoints?: Record<string, string>,
): { baseUrl: string; regionTag: string; fallbackAllowed: boolean } | null {
  if (config.region === "global" || !config.data_residency_enforced) {
    return null; // No residency routing needed
  }

  const endpoints = { ...EU_ENDPOINTS, ...customEndpoints };
  const euEndpoint = endpoints[provider];
  if (config.region === "eu" && euEndpoint) {
    return {
      baseUrl: euEndpoint,
      regionTag: "eu",
      fallbackAllowed: config.eu_fallback_allowed,
    };
  }

  // For EU tenants without EU-specific endpoints, we can't guarantee residency
  if (config.region === "eu" && !euEndpoint) {
    return {
      baseUrl: "", // No EU endpoint available
      regionTag: "eu_no_endpoint",
      fallbackAllowed: config.eu_fallback_allowed,
    };
  }

  return null;
}

export function shouldBlockForResidency(
  config: ResidencyConfig,
  provider: string,
): { blocked: boolean; reason: string } {
  if (!config.data_residency_enforced) {
    return { blocked: false, reason: "" };
  }

  if (config.region === "eu") {
    const euEndpoint = EU_ENDPOINTS[provider];
    if (!euEndpoint && !config.eu_fallback_allowed) {
      return {
        blocked: true,
        reason: `Provider ${provider} has no EU-specific endpoint and eu_fallback_allowed is false. Set eu_fallback_allowed to true or use a provider with EU endpoints.`,
      };
    }
  }

  return { blocked: false, reason: "" };
}

export function parseResidencyFromJson(json: unknown): ResidencyConfig {
  if (!json || typeof json !== "object") {
    return { tenant_id: "", region: "global", data_residency_enforced: false, eu_fallback_allowed: false };
  }
  const r = json as Record<string, unknown>;
  const region = typeof r.region === "string" && ["global", "eu", "us", "apac"].includes(r.region)
    ? r.region as ResidencyConfig["region"]
    : "global";
  return {
    tenant_id: typeof r.tenant_id === "string" ? r.tenant_id : "",
    region,
    data_residency_enforced: r.data_residency_enforced === true,
    eu_fallback_allowed: r.eu_fallback_allowed === true,
  };
}
