import { Tiktoken } from "js-tiktoken/lite";
import cl100kBase from "js-tiktoken/ranks/cl100k_base";
import o200kBase from "js-tiktoken/ranks/o200k_base";
import { analyzePayload, shouldBlockOnPii } from "./classifier";
import { handleScheduled } from "./cron";
import { dashboardHtml } from "./dashboard";
import { demoHtml } from "./demo";
import { loginHtml } from "./login";
import { robotsTxt, sitemapXml, logoSocialSvg, faviconSvg } from "./seo";
import { getOnboardingHtml } from "./onboarding";
import { getContactEmailHtml, getProvisionEmailHtml, buildWelcomeEmail } from "./emails";
import { type UptimeRecord } from "./sla";
import { evaluateRules, parseRulesFromJson, type TenantRule, type RequestContext, type RuleEvaluationResult } from "./rules";
import { generateReportHtml, generateSoc2Export, type ComplianceReport, type Soc2Export } from "./compliance";
import { getResidencyForProvider, shouldBlockForResidency, parseResidencyFromJson, type ResidencyConfig } from "./residency";
import { generateAuthnRequest, parseSamlResponse, mapSubjectToTenant, type SamlConfig } from "./saml";
import { calculateCost, EXACT_MATCH_PRICING, FUZZY_MATCH_PRICING } from "./pricing";
import { escapeHtml } from "./utils";

import { AwsClient } from "aws4fetch";

import { type Provider, type Env } from "./types";
export { SessionTracker } from "./session_do";
export { TenantBalance } from "./balance_do";
export { BudgetTracker } from "./budget_do";

async function dispatchTenantWebhook(env: Env, tenantId: string, slackPayload: string) {
  const tenantWebhook = await env.KV.get(`tenant:slack_webhook:${tenantId}`);
  if (!tenantWebhook) return;
  
  const planRaw = await env.KV.get(`tenant:plan:${tenantId}`);
  let isPro = false;
  if (planRaw) {
    try {
      const planData = JSON.parse(planRaw);
      if (planData.plan === "pro" || planData.plan === "enterprise") isPro = true;
    } catch (e) {}
  }
  
  if (isPro) {
    try {
      const parsed = new URL(tenantWebhook);
      if (parsed.protocol === "https:" && parsed.hostname === "hooks.slack.com") {
        await fetch(tenantWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: slackPayload
        }).catch(() => {});
      }
    } catch {
      // Invalid URL — skip webhook
    }
  }
}

interface RouteMatch {
  provider: Provider;
  upstreamPath: string;
  upstreamUrl: string;
}

interface AuthResponse {
  user?: { id?: string };
  id?: string;
}

interface PlanData {
  plan: string;
  fallback_policy?: "fail_open" | "fail_closed";
  currentPeriodEnd?: string;
}

interface CapturedPayload {
  json: unknown;
  rawText: string;
  parseError?: string;
}

interface Usage {
  promptTokens?: number;
  completionTokens?: number;
}

async function writeAuditLog(env: Env, tenantId: string, action: string, actor: string, resource: string, status: "SUCCESS" | "FAILED" | "BLOCKED", metadata?: Record<string, unknown>) {
  const auditLogId = crypto.randomUUID();
  const ts = new Date().toISOString();
  const auditKey = `audit:${tenantId}:${Date.now()}_${auditLogId}`;
  
  const payload = {
    id: auditLogId,
    timestamp: ts,
    action,
    actor,
    resource,
    status,
    metadata
  };

  await env.KV.put(auditKey, JSON.stringify(payload), { expirationTtl: 30 * 24 * 60 * 60 }); // 30 day retention
}

interface CapturedResponse {
  json: Record<string, unknown> | null;
  completionText: string;
  error: string | null;
  usage: Usage;
  isStream: boolean;
  model: string | null;
}

async function generateCacheKey(tenantId: string, rawText: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${tenantId}:${rawText}`));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "aw_cache:" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

interface LogRecord {
  tenant_id: string;
  provider: Provider;
  upstream_path: string;
  model: string | null;
  request_started_at: string;
  response_status: number | null;
  is_stream: boolean;
  prompt_tokens: number;
  completion_tokens: number;
  upstream_ttfb_ms: number | null;
  total_latency_ms: number;
  proxy_overhead_ms: number;
  upstream_request_id: string | null;
  identified_risks: string[];
  project: string | null;
  team: string | null;
  session_id: string | null;
  iteration_index: number | null;
  cumulative_tokens_in_session: number | null;
  error: string | null;
}

const OPENAI_DEFAULT_BASE_URL = "https://api.openai.com";
const ANTHROPIC_DEFAULT_BASE_URL = "https://api.anthropic.com";
const GROQ_DEFAULT_BASE_URL = "https://api.groq.com/openai";
const XAI_DEFAULT_BASE_URL = "https://api.x.ai";
const GEMINI_DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
const XIAOMI_DEFAULT_BASE_URL = "https://api.xiaomimimo.com/api/free-ai/openai";
const MISTRAL_DEFAULT_BASE_URL = "https://api.mistral.ai/v1";
const COHERE_DEFAULT_BASE_URL = "https://api.cohere.com/v2";
const DEFAULT_ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_LOG_WRITE_TIMEOUT_MS = 1500;

const VALID_RISK_TAGS: ReadonlySet<string> = new Set([
  "PII_EMAIL",
  "PII_SSN",
  "FINANCIAL_CREDIT_CARD",
  "SECRET_AWS_ACCESS_KEY",
  "SECRET_STRIPE",
  "SECRET_GITHUB",
  "SECRET_JWT",
]);

const ALLOWED_PROVIDERS: ReadonlySet<string> = new Set(["openai", "anthropic", "groq", "xai", "gemini", "azure", "bedrock", "xiaomi", "mistral", "cohere"]);
const MAX_INGEST_PAYLOAD_BYTES = 1024 * 1024; // 1MB

let tenantCache: { raw: string; tokens: Map<string, string> } | undefined;
const MAX_ENCODER_CACHE = 20;
const encoderCache = new Map<string, Tiktoken>();
const MAX_RULES_CACHE = 500;

const PLAN_LIMITS: Record<string, number> = {
  free: 50000,
  pro: 500000,
  enterprise: Infinity,
};

const worker: ExportedHandler<Env> = {
  scheduled: handleScheduled,

  async fetch(request, env, ctx): Promise<Response> {
    const startTime = Date.now();
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    try {
    // Normalize pathname — strip trailing slashes (but not root "/")
    const rawPathname = url.pathname;
    const normalizedPathname = rawPathname === "/" ? "/" : rawPathname.replace(/\/+$/, "");

    if (normalizedPathname === "/healthz") {
      return new Response("ok", { status: 200, headers: { "content-type": "text/plain" } });
    }

    if (request.method === "GET" && pathname === "/robots.txt") {
      return new Response(robotsTxt, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    if (request.method === "GET" && pathname === "/sitemap.xml") {
      return new Response(sitemapXml, { status: 200, headers: { "Content-Type": "application/xml; charset=utf-8" } });
    }

    if (request.method === "GET" && pathname === "/logo_social.svg") {
      return new Response(logoSocialSvg, { status: 200, headers: { "Content-Type": "image/svg+xml; charset=utf-8" } });
    }

    if (request.method === "GET" && pathname === "/login") {
      return new Response(loginHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders(env), ...securityHeaders() },
      });
    }

    if (request.method === "GET" && pathname === "/onboarding") {
      const onboardingHtml = getOnboardingHtml(env.SITE_URL || "http://localhost:8787");
      return new Response(onboardingHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders(env), ...securityHeaders() },
      });
    }

    if (request.method === "GET" && pathname.endsWith("/models")) {
      // Return dynamically generated models list from the parsed pricing CSV
      const mockModels = {
        object: "list",
        data: Object.keys(EXACT_MATCH_PRICING).filter(key => key !== "default").map(id => ({
          id,
          object: "model",
          created: Math.floor(Date.now() / 1000),
          owned_by: "agentwatch"
        }))
      };
      return new Response(JSON.stringify(mockModels), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(env) }
      });
    }

    if (request.method === "GET" && pathname.includes("/models/")) {
      // Mock specific model response
      const parts = pathname.split("/");
      const modelId = parts[parts.length - 1];
      const mockModel = { id: modelId, object: "model", created: Math.floor(Date.now() / 1000), owned_by: "agentwatch" };
      return new Response(JSON.stringify(mockModel), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(env) }
      });
    }

    if (request.method === "POST" && pathname === "/v1/auth/signup") {
      // Rate limit signup using native RateLimiter
      const signupIp = request.headers.get("cf-connecting-ip") || "unknown";
      if (env.RATE_LIMITER) {
        const { success } = await env.RATE_LIMITER.limit({ key: `signup:${signupIp}` });
        if (!success) return jsonError(429, "Too many signup attempts. Please try again later.");
      }

      let body: Record<string, unknown>;
      try { body = await request.json() as Record<string, unknown>; } catch { return jsonError(400, "Invalid JSON"); }
      if (!body.email || !body.password) return jsonError(400, "Email and password required");
      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!EMAIL_RE.test(String(body.email))) return jsonError(400, "Invalid email format");

      // Password strength validation
      const pw = String(body.password);
      if (pw.length < 8 || !/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) {
        return jsonError(400, "Password must be at least 8 characters and contain at least one letter and one number.");
      }

      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        const authResp = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
          method: "POST",
          headers: supabaseHeaders(env),
          body: JSON.stringify({ email: body.email, password: body.password, email_confirm: true })
        });
        
        if (!authResp.ok) {
          const errText = await authResp.text();
          // Don't expose upstream error details to clients
          console.error("Supabase error:", authResp.status);
          return jsonError(authResp.status, "Failed to create user. Please try again.");
        }

        // Auto-provision tenant
        const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, "0")).join("");
        const tenantId = "tenant_live_" + randomHex;
        
        const keyHex = Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, "0")).join("");
        const rawToken = "aw_live_" + keyHex;
        const keyPrefix = rawToken.substring(0, 16) + "...";

        // Sync to Supabase developer_keys if possible
        await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/create_developer_key`, {
          method: "POST",
          headers: supabaseHeaders(env),
          body: JSON.stringify({
            p_tenant_id: tenantId,
            p_name: "Master API Key",
            p_role: "admin",
            p_key_prefix: keyPrefix
          })
        }).catch(() => {});

        // Save to KV (with 90-day TTL)
        const tokenTtl = 90 * 24 * 60 * 60;
        await env.KV.put(`tenant:token:${rawToken}`, JSON.stringify({ tenantId, role: "admin" }), { expirationTtl: tokenTtl });
        await env.KV.put(`user_auth:${String(body.email).toLowerCase()}`, JSON.stringify({ tenantId, rawToken }), { expirationTtl: tokenTtl });

        // Provision free tier tokens (100K tokens)
        try {
          const balanceStub = env.TENANT_BALANCE.get(env.TENANT_BALANCE.idFromName(tenantId));
          await balanceStub.addCredits(0.10, tenantId); // $0.10 = 100K tokens at $1/1M
        } catch (e) { console.error("Failed to provision free tokens:", e); }
        await env.KV.put(`tenant:plan:${tenantId}`, JSON.stringify({ plan: "free" }));

        // Send welcome email
        if (env.RESEND_API_KEY) {
          const welcomeHtml = buildWelcomeEmail(rawToken, env.SITE_URL);
          ctx.waitUntil(
            fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ from: env.REPORT_FROM_EMAIL || `AgentWatch <hello@${env.SITE_URL || "localhost:8787"}>`, to: body.email, subject: "Welcome to AgentWatch — Your API Key", html: welcomeHtml })
            }).catch(e => console.error("Failed to send welcome email:", e))
          );

          // Store signup info for email drip sequence
          ctx.waitUntil(
            env.KV.put(`drip:${tenantId}`, JSON.stringify({
              email: body.email,
              tenantId,
              rawToken,
              signedUpAt: new Date().toISOString(),
              dripDay1Sent: false,
              dripDay3Sent: false,
              dripDay7Sent: false,
            }), { expirationTtl: 30 * 24 * 60 * 60 }) // 30 days TTL
          );
        }

        return Response.json({ rawToken, tenantId }, { status: 200, headers: corsHeaders(env) });
      }
      return jsonError(500, "Supabase not configured");
    }

    if (request.method === "POST" && pathname === "/v1/auth/login") {
      // Rate limit login using native RateLimiter
      const loginIp = request.headers.get("cf-connecting-ip") || "unknown";
      if (env.RATE_LIMITER) {
        const { success } = await env.RATE_LIMITER.limit({ key: `login:${loginIp}` });
        if (!success) return jsonError(429, "Too many login attempts. Please try again later.");
      }

      let body: Record<string, unknown>;
      try { body = await request.json() as Record<string, unknown>; } catch { return jsonError(400, "Invalid JSON"); }
      if (!body.email || !body.password) return jsonError(400, "Email and password required");
      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!EMAIL_RE.test(String(body.email))) return jsonError(400, "Invalid email format");

      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        const authResp = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: supabaseHeaders(env),
          body: JSON.stringify({ email: body.email, password: body.password })
        });

        if (!authResp.ok) {
          return jsonError(401, "Invalid email or password");
        }

        let userDataStr = await env.KV.get(`user_auth:${String(body.email).toLowerCase()}`);
        if (!userDataStr) {
          // Auto-provision if user exists in Supabase but KV was wiped or didn't sync
          const authData = await authResp.json() as AuthResponse;
          const tenantId = authData.user?.id || authData.id;
          if (!tenantId) {
            return jsonError(500, "Failed to retrieve user ID from authentication provider");
          }

          const keyBytes = new Uint8Array(16);
          crypto.getRandomValues(keyBytes);
          const keyHex = Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
          const rawToken = "aw_live_" + keyHex;
          const keyPrefix = rawToken.substring(0, 16) + "...";

          await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/create_developer_key`, {
            method: "POST",
            headers: supabaseHeaders(env),
            body: JSON.stringify({
              p_tenant_id: tenantId,
              p_name: "Master API Key",
              p_role: "admin",
              p_key_prefix: keyPrefix
            })
          }).catch(() => {});

          const tokenTtl = 90 * 24 * 60 * 60;
          await env.KV.put(`tenant:token:${rawToken}`, JSON.stringify({ tenantId, role: "admin" }), { expirationTtl: tokenTtl });
          
          const newUserData = { tenantId, rawToken };
          await env.KV.put(`user_auth:${String(body.email).toLowerCase()}`, JSON.stringify(newUserData), { expirationTtl: tokenTtl });
          
          try {
            const balanceStub = env.TENANT_BALANCE.get(env.TENANT_BALANCE.idFromName(tenantId));
            await balanceStub.addCredits(0.10, tenantId);
          } catch (e) { console.error("Failed to provision free tokens:", e); }

          userDataStr = JSON.stringify(newUserData);
        }

        const userData = JSON.parse(userDataStr);
        return Response.json({ rawToken: userData.rawToken, tenantId: userData.tenantId }, { status: 200, headers: corsHeaders(env) });
      }
      return jsonError(500, "Supabase not configured");
    }

    if (request.method === "GET" && pathname === "/v1/dashboard") {
      return new Response(dashboardHtml, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders(env), ...securityHeaders() },
      });
    }

    if (request.method === "GET" && pathname === "/demo") {
      return new Response(demoHtml, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate", ...corsHeaders(env), ...securityHeaders() },
      });
    }

    if (request.method === "GET" && pathname === "/v1/dashboard/summary") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const url = new URL(request.url);
      const days = safeParseInt(url.searchParams.get("days"), 30);
      let result = env.SUPABASE_URL
        ? await callRpc(env, "get_dashboard_summary", tenantId, days)
        : null;
        
      const id = env.TENANT_BALANCE.idFromName(tenantId);
      const stub = env.TENANT_BALANCE.get(id);
      let tenant_balance = 0;
      try {
        tenant_balance = await stub.getBalance();
      } catch (e) {
        console.error("Failed to fetch balance for dashboard summary:", e);
      }

      if (result && typeof result === 'object') {
        (result as Record<string, unknown>).tenant_balance = tenant_balance;
      } else if (!result) {
        result = { tenant_balance };
      }

      return Response.json(result || { error: "Supabase not configured" }, { status: result ? 200 : 500, headers: corsHeaders(env) });
    }

    if (request.method === "GET" && pathname === "/v1/dashboard/analytics/advanced") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const planRaw = await env.KV.get(`tenant:plan:${tenantId}`);
      let isPro = false;
      if (planRaw) {
        try {
          const planData = JSON.parse(planRaw);
          if (planData.plan === "pro" || planData.plan === "enterprise") isPro = true;
        } catch (e) {}
      }

      if (!isPro) {
        return jsonError(403, "Upgrade Required: Advanced Analytics are only available on the Pro or Enterprise plan.");
      }

      const url = new URL(request.url);
      const days = safeParseInt(url.searchParams.get("days"), 14);
      
      const result = env.SUPABASE_URL
        ? await callRpc(env, "get_dashboard_analytics_advanced", tenantId, days)
        : { costByModel: [], latencyByProvider: [], tokens: {promptTokens: 0, completionTokens: 0}, traffic: [] };

      return Response.json(result, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "GET" && pathname === "/v1/dashboard/sessions") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const url = new URL(request.url);
      const days = safeParseInt(url.searchParams.get("days"), 7);
      const result = env.SUPABASE_URL
        ? await callRpc(env, "get_dashboard_sessions", tenantId, days)
        : null;
      return Response.json(result || [], { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "GET" && pathname === "/v1/dashboard/anomalies") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      if (!(await isProOrHigher(tenantId, env))) return jsonError(403, "Anomaly detection requires Pro plan.");

      const url = new URL(request.url);
      const days = safeParseInt(url.searchParams.get("days"), 7);
      const result = env.SUPABASE_URL
        ? await callRpc(env, "get_dashboard_anomalies", tenantId, days)
        : null;
      return Response.json(result || [], { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "GET" && pathname === "/v1/dashboard/spend-trend") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const result = env.SUPABASE_URL
        ? await callRpc(env, "get_dashboard_spend_trend", tenantId)
        : null;
      return Response.json(result || [], { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "GET" && pathname === "/v1/dashboard/providers") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const url = new URL(request.url);
      const days = safeParseInt(url.searchParams.get("days"), 30);
      const result = env.SUPABASE_URL
        ? await callRpc(env, "get_dashboard_provider_breakdown", tenantId, days)
        : null;
      return Response.json(result || [], { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "GET" && pathname === "/v1/dashboard/teams") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const url = new URL(request.url);
      const days = safeParseInt(url.searchParams.get("days"), 30);
      const result = env.SUPABASE_URL
        ? await callRpc(env, "get_dashboard_team_spend", tenantId, days)
        : null;
      return Response.json(result || [], { status: 200, headers: corsHeaders(env) });
    }

    // Per-agent spend breakdown
    if (request.method === "GET" && pathname === "/v1/dashboard/agent-spend") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const url2 = new URL(request.url);
      const days = safeParseInt(url2.searchParams.get("days"), 7);
      const cutoff = new Date(Date.now() - days * 86400000).toISOString();

      // Aggregate from audit logs
      const agentMap = new Map<string, { tokens: number; cost: number; requests: number }>();
      try {
        const prefix = `audit:${tenantId}:`;
        const listRes = await env.KV.list({ prefix, limit: 1000 });
        for (const key of listRes.keys) {
          const val = await env.KV.get(key.name);
          if (val) {
            try {
              const entry = JSON.parse(val);
              if (entry.timestamp && entry.timestamp < cutoff) continue;
              const agent = entry.agent || "unattributed";
              const tokens = (entry.prompt_tokens || 0) + (entry.completion_tokens || 0);
              const cost = entry.cost_usd || 0;
              const existing = agentMap.get(agent) || { tokens: 0, cost: 0, requests: 0 };
              existing.tokens += tokens;
              existing.cost += cost;
              existing.requests += 1;
              agentMap.set(agent, existing);
            } catch(e) {}
          }
        }
      } catch(e) {}

      const result = Array.from(agentMap.entries()).map(([agent, data]) => ({
        agent,
        tokens: data.tokens,
        cost: Math.round(data.cost * 10000) / 10000,
        requests: data.requests,
      })).sort((a, b) => b.cost - a.cost);

      return Response.json(result, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "GET" && pathname === "/v1/dashboard/manage-teams") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const result = env.SUPABASE_URL
        ? await callRpc(env, "get_dashboard_team_list", tenantId)
        : [];
      return Response.json(result || [], { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "POST" && pathname === "/v1/dashboard/manage-teams") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      let body: Record<string, unknown>;
      try { body = await request.json() as Record<string, unknown>; } catch { return jsonError(400, "Invalid JSON"); }

      const teamName = typeof body.name === "string" && body.name.trim() !== "" ? body.name.trim() : null;
      if (!teamName) return jsonError(400, "Team name is required");
      if (teamName.length > 255) return jsonError(400, "Team name must be under 255 characters");

      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/create_team`, {
          method: "POST",
          headers: supabaseHeaders(env),
          body: JSON.stringify({ p_tenant_id: tenantId, p_name: teamName })
        });
        if (resp.ok) {
          const result = await resp.json();
          return Response.json(result, { status: 200, headers: corsHeaders(env) });
        } else {
          const errText = await resp.text();
          console.error("Supabase error:", resp.status);
          return jsonError(500, "Failed to create team. Please try again.");
        }
      }
      return jsonError(500, "Supabase not configured");
    }

    if (request.method === "DELETE" && pathname.startsWith("/v1/dashboard/manage-teams/")) {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const teamName = decodeURIComponent(pathname.substring("/v1/dashboard/manage-teams/".length));
      if (!teamName) return jsonError(400, "Team name is required");

      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/delete_team`, {
          method: "POST",
          headers: supabaseHeaders(env),
          body: JSON.stringify({ p_tenant_id: tenantId, p_name: teamName })
        });
        if (resp.ok) {
          return Response.json({ success: true }, { status: 200, headers: corsHeaders(env) });
        } else {
          const errText = await resp.text();
          console.error("Supabase error:", resp.status);
          return jsonError(500, "Failed to delete team. Please try again.");
        }
      }
      return jsonError(500, "Supabase not configured");
    }
    if (request.method === "GET" && pathname === "/v1/dashboard/keys") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      if (!(await isProOrHigher(tenantId, env))) return jsonError(403, "Access Control requires Pro plan.");

      const result = env.SUPABASE_URL
        ? await callRpc(env, "get_dashboard_keys", tenantId)
        : [];
      return Response.json(result || [], { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "POST" && pathname === "/v1/dashboard/keys") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      if (!(await isProOrHigher(tenantId, env))) return jsonError(403, "Access Control requires Pro plan.");

      let body: Record<string, unknown>;
      try { body = await request.json() as Record<string, unknown>; } catch { return jsonError(400, "Invalid JSON"); }

      const keyName = typeof body.name === "string" && body.name.trim() !== "" ? body.name : "New Key";
      if (keyName.length > 255) return jsonError(400, "Key name must be under 255 characters");
      const keyRole = body.role === "admin" ? "admin" : "developer";
      const teamId = typeof body.team_id === "string" && body.team_id.trim() !== "" ? body.team_id.trim() : null;

      // Generate a secure proxy token
      const randomBytes = new Uint8Array(24);
      crypto.getRandomValues(randomBytes);
      const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, "0")).join("");
      const rawToken = "aw_live_" + randomHex;
      const keyPrefix = rawToken.substring(0, 16) + "...";

      let result = null;
      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        // Sync to Supabase for the dashboard
        const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/create_developer_key`, {
          method: "POST",
          headers: supabaseHeaders(env),
          body: JSON.stringify({
            p_tenant_id: tenantId,
            p_name: keyName,
            p_role: keyRole,
            p_team_id: teamId,
            p_key_prefix: keyPrefix
          })
        });
        if (resp.ok) {
          result = await resp.json();
        } else {
          const errText = await resp.text();
          console.error("Supabase error:", resp.status);
          return jsonError(500, "Failed to create key. Please try again.");
        }
      } else {
         return jsonError(500, "Supabase not configured");
      }

      // Sync to Edge KV for zero-latency enforcement
      await env.KV.put(`tenant:token:${rawToken}`, JSON.stringify({ tenantId, role: keyRole, teamId }));

      // Write Audit Log
      try {
          await writeAuditLog(env, tenantId, "key_created", "dashboard_user", keyPrefix, "SUCCESS", { name: keyName, role: keyRole, team_id: teamId });
      } catch (e) { console.error("Audit log error:", e); }

      // Send the full token to the user exactly once
      return Response.json({ ...(result as Record<string, unknown>), token: rawToken }, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "DELETE" && pathname === "/v1/dashboard/keys") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      let body: Record<string, unknown>;
      try { body = await request.json() as Record<string, unknown>; } catch { return jsonError(400, "Invalid JSON"); }
      if (!body.key_prefix) return jsonError(400, "key_prefix required");

      // Global Kill Switch: Instantly revoke via Edge KV
      await env.KV.put(`revoked:${body.key_prefix}`, "true", { expirationTtl: 604800 });

      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/revoke_developer_key`, {
          method: "POST",
          headers: supabaseHeaders(env),
          body: JSON.stringify({ p_tenant_id: tenantId, p_key_prefix: body.key_prefix })
        });
      }

      // Write Audit Log
      try {
          await writeAuditLog(env, tenantId, "key_revoked", "dashboard_user", String(body.key_prefix), "SUCCESS");
      } catch (e) { console.error("Audit log error:", e); }

      return Response.json({ success: true }, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "GET" && pathname === "/v1/dashboard/audit_logs") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      if (!(await isProOrHigher(tenantId, env))) return jsonError(403, "Audit Logs require Pro plan.");

      const result = [];
      const prefix = `audit:${tenantId}:`;
      const listRes = await env.KV.list({ prefix, limit: 100 });
      for (const key of listRes.keys) {
        const val = await env.KV.get(key.name);
        if (val) {
          try {
            result.push(JSON.parse(val));
          } catch(e){}
        }
      }
      
      // Sort newest first
      result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return Response.json(result, { status: 200, headers: corsHeaders(env) });
    }

    // Governance Timeline — audit logs for a specific session
    if (request.method === "GET" && pathname === "/v1/dashboard/timeline") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const url2 = new URL(request.url);
      const sessionId = url2.searchParams.get("session_id");
      if (!sessionId) return jsonError(400, "session_id query parameter required");

      const result = [];
      const prefix = `audit:${tenantId}:`;
      const listRes = await env.KV.list({ prefix, limit: 200 });
      for (const key of listRes.keys) {
        const val = await env.KV.get(key.name);
        if (val) {
          try {
            const entry = JSON.parse(val);
            if (entry.resource === sessionId) {
              result.push(entry);
            }
          } catch(e){}
        }
      }
      
      // Sort by timestamp ascending (timeline order)
      result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return Response.json({ session_id: sessionId, events: result }, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "DELETE" && pathname.startsWith("/v1/dashboard/keys/")) {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const keyId = pathname.substring("/v1/dashboard/keys/".length);
      if (!keyId) return jsonError(400, "Missing key ID");

      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/revoke_developer_key`, {
          method: "POST",
          headers: supabaseHeaders(env),
          body: JSON.stringify({ tenant_id_param: tenantId, id_param: keyId })
        });
        
        if (resp.ok) {
          const revokedKey = await resp.json() as { raw_token?: string } | null;
          if (revokedKey && revokedKey.raw_token) {
            // Delete from Cloudflare KV instantly to cut edge access
            await env.KV.delete(`tenant:token:${revokedKey.raw_token}`);
          }
          return Response.json({ success: true }, { status: 200, headers: corsHeaders(env) });
        } else {
          return jsonError(500, "Failed to revoke key in Supabase");
        }
      }
      return jsonError(500, "Supabase not configured");
    }

    if (request.method === "GET" && pathname === "/v1/dashboard/settings/slack") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const webhookUrl = await env.KV.get(`tenant:slack_webhook:${tenantId}`);
      return Response.json({ webhookUrl: webhookUrl || null }, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "POST" && pathname === "/v1/dashboard/settings/slack") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      let payload: { webhookUrl: string };
      try {
        payload = await request.json() as { webhookUrl: string };
      } catch (e) {
        return jsonError(400, "Invalid JSON body");
      }

      // Pro Tier check
      const planRaw = await env.KV.get(`tenant:plan:${tenantId}`);
      let isPro = false;
      if (planRaw) {
        try {
          const planData = JSON.parse(planRaw);
          if (planData.plan === "pro" || planData.plan === "enterprise") {
            isPro = true;
          }
        } catch (e) {}
      }
      if (!isPro) {
        return jsonError(403, "Slack Webhook integration requires a Pro or Enterprise plan.");
      }

      if (payload.webhookUrl) {
        try {
          const parsed = new URL(payload.webhookUrl);
          if (parsed.protocol !== "https:" || parsed.hostname !== "hooks.slack.com") {
            return jsonError(400, "Invalid Slack webhook URL. Must be https://hooks.slack.com/...");
          }
        } catch {
          return jsonError(400, "Invalid Slack webhook URL format.");
        }
        await env.KV.put(`tenant:slack_webhook:${tenantId}`, payload.webhookUrl);
      } else {
        await env.KV.delete(`tenant:slack_webhook:${tenantId}`);
      }

      return Response.json({ success: true }, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "GET" && pathname === "/v1/dashboard/settings") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const webhookUrl = await env.KV.get(`tenant:slack_webhook:${tenantId}`);
      let dbSettings: Record<string, unknown> = { alert_email: "", alert_threshold_pct: 80, data_retention_days: 30 };
      if (env.SUPABASE_URL) {
        const res = await callRpc(env, "get_tenant_settings", tenantId) as Record<string, unknown> | null;
        if (res && !res.error) {
          dbSettings = res;
        }
      }

      const planData = await getTenantPlan(tenantId, env);

      const settingsRaw = await env.KV.get(`tenant:settings:${tenantId}`);
      const tenantSettings = settingsRaw ? JSON.parse(settingsRaw) : {};

      return Response.json({
        webhookUrl: webhookUrl || null,
        alertEmail: String(dbSettings.alert_email || ""),
        alertThreshold: Number(dbSettings.alert_threshold_pct) || 80,
        dataRetention: Number(dbSettings.data_retention_days) || 0,
        fallbackPolicy: planData.fallbackPolicy,
        cacheEnabled: tenantSettings.cache_enabled === true,
        governance_mode: tenantSettings.governance_mode || "soft",
        block_on_pii: tenantSettings.block_on_pii === true,
        loop_detection_action: tenantSettings.loop_detection_action || "block",
      }, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "POST" && pathname === "/v1/dashboard/settings") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      let payload: { webhookUrl?: string, alertEmail?: string, alertThreshold?: number, dataRetention?: number, fallbackPolicy?: "fail_open" | "fail_closed", cacheEnabled?: boolean, governance_mode?: string, block_on_pii?: boolean, loop_detection_action?: string };
      try {
        payload = await request.json() as typeof payload;
      } catch (e) {
        return jsonError(400, "Invalid JSON body");
      }

      const planRaw = await env.KV.get(`tenant:plan:${tenantId}`);
      let isPro = false;
      let planObj: PlanData & Record<string, unknown> = { plan: "free", fallback_policy: "fail_open" };
      if (planRaw) {
        try {
          const planData = JSON.parse(planRaw);
          planObj = { ...planData };
          if (planData.plan === "pro" || planData.plan === "enterprise") isPro = true;
        } catch (e) {}
      }

      if (payload.fallbackPolicy !== undefined) {
        planObj.fallback_policy = payload.fallbackPolicy;
        await env.KV.put(`tenant:plan:${tenantId}`, JSON.stringify(planObj));
        
        if (env.SUPABASE_URL) {
          await fetch(`${env.SUPABASE_URL}/rest/v1/tenant_settings?tenant_id=eq.${tenantId}`, {
            method: "PATCH",
            headers: supabaseHeaders(env),
            body: JSON.stringify({ fallback_policy: payload.fallbackPolicy })
          });
        }
      }

      if (payload.webhookUrl !== undefined) {
        if (!isPro && payload.webhookUrl !== "") return jsonError(403, "Slack Webhook requires Pro plan.");
        if (payload.webhookUrl) {
          if (!payload.webhookUrl.startsWith("https://hooks.slack.com/")) return jsonError(400, "Invalid webhook.");
          await env.KV.put(`tenant:slack_webhook:${tenantId}`, payload.webhookUrl);
        } else {
          await env.KV.delete(`tenant:slack_webhook:${tenantId}`);
        }
      }

      if (payload.cacheEnabled !== undefined) {
        if (!isPro) return jsonError(403, "Caching requires Pro plan.");
        await env.KV.put(`tenant:settings:${tenantId}`, JSON.stringify({ cache_enabled: payload.cacheEnabled }), { expirationTtl: 365 * 24 * 60 * 60 });
      }

      // Governance mode and security settings
      if (payload.governance_mode !== undefined || payload.block_on_pii !== undefined || payload.loop_detection_action !== undefined) {
        const existingRaw = await env.KV.get(`tenant:settings:${tenantId}`);
        const existing = existingRaw ? JSON.parse(existingRaw) : {};
        if (payload.governance_mode !== undefined) {
          existing.governance_mode = payload.governance_mode; // "observe" | "soft" | "hard"
        }
        if (payload.block_on_pii !== undefined) {
          existing.block_on_pii = payload.block_on_pii;
        }
        if (payload.loop_detection_action !== undefined) {
          existing.loop_detection_action = payload.loop_detection_action;
        }
        await env.KV.put(`tenant:settings:${tenantId}`, JSON.stringify(existing), { expirationTtl: 365 * 24 * 60 * 60 });
      }

      if (env.SUPABASE_URL) {
        const email = payload.alertEmail || "";
        const threshold = Math.max(0, Math.min(100, Number(payload.alertThreshold) || 80));
        const retention = Math.max(1, Math.min(365, Number(payload.dataRetention !== undefined ? payload.dataRetention : 30)));
        if (!isPro && retention > 0) return jsonError(403, "Data Retention policy requires Pro plan.");
        await callRpc(env, "upsert_tenant_settings", tenantId, email, threshold, retention);
      }

      return Response.json({ success: true }, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "POST" && pathname === "/v1/dashboard/settings/export") {
      const tenantId = await authenticateTenantId(request, env);
      if (!tenantId || tenantId === "CONFIG_ERROR") return jsonError(401, "Unauthorized");

      if (!env.SUPABASE_URL) return jsonError(500, "Database not configured");
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/llm_request_logs?tenant_id=eq.${tenantId}`, {
        headers: {
          ...supabaseHeaders(env),
          "Accept": "text/csv"
        }
      });
      if (!res.ok) return jsonError(500, "Export failed");
      const csvData = await res.text();
      return new Response(csvData, {
        status: 200,
        headers: {
          ...corsHeaders(env),
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="agentwatch_logs_${tenantId}.csv"`
        }
      });
    }

    if (request.method === "POST" && pathname === "/v1/dashboard/settings/reset") {
      const tenantId = await authenticateTenantId(request, env);
      if (!tenantId || tenantId === "CONFIG_ERROR") return jsonError(401, "Unauthorized");
      if (env.SUPABASE_URL) await callRpc(env, "reset_workspace", tenantId);
      return Response.json({ success: true }, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "POST" && pathname === "/v1/dashboard/settings/delete") {
      const tenantId = await authenticateTenantId(request, env);
      if (!tenantId || tenantId === "CONFIG_ERROR") return jsonError(401, "Unauthorized");
      if (env.SUPABASE_URL) await callRpc(env, "delete_workspace", tenantId);
      // Delete from KV using cursor-based pagination with timeout guard
      const startTime = Date.now();
      const MAX_DELETE_DURATION_MS = 30_000;
      const BATCH_SIZE = 100;
      let deletedCount = 0;
      let cursor: string | undefined;
      let listComplete = false;
      while (!listComplete) {
        if (Date.now() - startTime > MAX_DELETE_DURATION_MS) break;
        const listResult = await env.KV.list({ prefix: `tenant:${tenantId}:`, limit: BATCH_SIZE, cursor });
        const keysToDelete: string[] = [];
        for (const k of listResult.keys) {
          keysToDelete.push(k.name);
        }
        for (const key of keysToDelete) {
          await env.KV.delete(key);
          deletedCount++;
        }
        listComplete = listResult.list_complete;
        cursor = listResult.list_complete ? undefined : listResult.cursor;
        // Yield control periodically to avoid blocking
        if (deletedCount > 0 && deletedCount % BATCH_SIZE === 0) {
          await new Promise(r => setTimeout(r, 0));
        }
      }
      return Response.json({ success: true, deleted_keys: deletedCount, ...(Date.now() - startTime > MAX_DELETE_DURATION_MS ? { partial: true } : {}) }, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "GET" && pathname === "/v1/teams/budgets") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      if (!(await isProOrHigher(tenantId, env))) return jsonError(403, "Team Budgets require Pro plan.");

      const result = env.SUPABASE_URL
        ? await callRpc(env, "check_team_budgets", tenantId)
        : null;
      return Response.json(result || { error: "Supabase not configured" }, { status: result ? 200 : 500, headers: corsHeaders(env) });
    }

    if (request.method === "GET" && pathname === "/v1/teams/budget-check") {
      const url = new URL(request.url);
      const team = url.searchParams.get("team");
      if (!team) return jsonError(400, "Missing team parameter");

      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      if (!(await isProOrHigher(tenantId, env))) return jsonError(403, "Team Budgets require Pro plan.");

      const result = env.SUPABASE_URL
        ? await callRpc(env, "get_team_monthly_spend", tenantId, team)
        : null;
      return Response.json(result || { error: "Supabase not configured" }, { status: result ? 200 : 500, headers: corsHeaders(env) });
    }

    if (request.method === "POST" && pathname === "/v1/teams/budgets") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      if (!(await isProOrHigher(tenantId, env))) return jsonError(403, "Team Budgets require Pro plan.");

      let body: Record<string, unknown>;
      try { body = await request.json() as Record<string, unknown>; } catch { return jsonError(400, "Invalid JSON"); }

      const team = typeof body.team === "string" ? body.team : null;
      const monthlyBudgetUsd = typeof body.monthly_budget_usd === "number" ? body.monthly_budget_usd : null;
      const alertThresholdPct = typeof body.alert_threshold_pct === "number" ? body.alert_threshold_pct : 80;
      const hardStop = typeof body.hard_stop === "boolean" ? body.hard_stop : false;

      if (!team || !monthlyBudgetUsd) return jsonError(400, "team and monthly_budget_usd are required");

      const upsertResult = await upsertTeamBudget(env, tenantId, team, monthlyBudgetUsd, alertThresholdPct, hardStop);
      if (!upsertResult) return jsonError(500, "Failed to save team budget");
      return Response.json({ success: true }, { status: 200, headers: corsHeaders(env) });
    }

    // --- Agent Budgets (Pro + Enterprise) ---
    if (request.method === "GET" && pathname === "/v1/teams/agent-budgets") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      if (!(await isProOrHigher(tenantId, env))) return jsonError(403, "Agent Budgets require Pro plan.");

      const result = await callRpc(env, "check_agent_budgets", tenantId);
      return Response.json(result || [], { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "POST" && pathname === "/v1/teams/agent-budgets") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      if (!(await isProOrHigher(tenantId, env))) return jsonError(403, "Agent Budgets require Pro plan.");

      let body: Record<string, unknown>;
      try { body = await request.json() as Record<string, unknown>; } catch { return jsonError(400, "Invalid JSON"); }

      const team = typeof body.team === "string" ? body.team : null;
      const agentName = typeof body.agent_name === "string" ? body.agent_name : null;
      const monthlyBudgetUsd = typeof body.monthly_budget_usd === "number" ? body.monthly_budget_usd : null;
      const alertThresholdPct = typeof body.alert_threshold_pct === "number" ? body.alert_threshold_pct : 80;
      const hardStop = typeof body.hard_stop === "boolean" ? body.hard_stop : false;

      if (!team || !agentName || !monthlyBudgetUsd) return jsonError(400, "team, agent_name, and monthly_budget_usd are required");

      const result = await callRpcWithParams(env, "upsert_agent_budget", {
        tenant_id_param: tenantId,
        team_param: team,
        agent_param: agentName,
        monthly_budget_usd: monthlyBudgetUsd,
        alert_threshold_pct: alertThresholdPct,
        hard_stop: String(hardStop),
      });

      // Invalidate KV cache
      await env.KV.delete(`agent_budget:${tenantId}:${team}:${agentName}`);

      return Response.json({ success: true, budget: result }, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "DELETE" && pathname.startsWith("/v1/teams/agent-budgets/")) {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      if (!(await isProOrHigher(tenantId, env))) return jsonError(403, "Agent Budgets require Pro plan.");

      // Parse team/agent from path: /v1/teams/agent-budgets/{team}/{agent}
      const pathParts = pathname.split("/").filter(Boolean);
      const team = pathParts[3] || null;
      const agentName = pathParts[4] || null;
      if (!team || !agentName) return jsonError(400, "team and agent_name required in path");

      await callRpcWithParams(env, "delete_agent_budget", {
        tenant_id_param: tenantId,
        team_param: team,
        agent_param: agentName,
      });

      // Invalidate KV cache
      await env.KV.delete(`agent_budget:${tenantId}:${team}:${agentName}`);

      return Response.json({ success: true }, { status: 200, headers: corsHeaders(env) });
    }

    // Custom anomaly rules management
    if (request.method === "GET" && pathname === "/v1/rules") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const planRaw = await env.KV.get(`tenant:plan:${tenantId}`);
      let isPro = false;
      if (planRaw) {
        try {
          const planData = JSON.parse(planRaw);
          if (planData.plan === "pro" || planData.plan === "enterprise") isPro = true;
        } catch (e) {}
      }
      if (!isPro) {
        return Response.json([], { status: 200, headers: corsHeaders(env) });
      }

      const rules = await getTenantRules(env, tenantId);
      return Response.json(rules, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "POST" && pathname === "/v1/rules") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      let body: Record<string, unknown>;
      try { body = await request.json() as Record<string, unknown>; } catch { return jsonError(400, "Invalid JSON"); }

      const planRaw = await env.KV.get(`tenant:plan:${tenantId}`);
      let isPro = false;
      if (planRaw) {
        try {
          const planData = JSON.parse(planRaw);
          if (planData.plan === "pro" || planData.plan === "enterprise") isPro = true;
        } catch (e) {}
      }
      if (!isPro) return jsonError(403, "Upgrade Required: Custom Anomaly Rules are only available on the Pro or Enterprise plan.");

      const name = typeof body.name === "string" ? body.name.trim() : null;
      const condition = body.condition;
      const action = typeof body.action === "string" ? body.action : null;

      if (!name || !condition || !action) return jsonError(400, "name, condition, and action are required");
      if (name.length > 255) return jsonError(400, "Rule name must be under 255 characters");
      if (!["allow", "block", "throttle", "alert", "tag"].includes(action)) return jsonError(400, "action must be allow, block, throttle, alert, or tag");
      if (typeof condition !== "object" || condition === null) return jsonError(400, "condition must be an object");

      const priority = typeof body.priority === "number" ? body.priority : 100;
      const enabled = body.enabled !== false;
      const actionConfig = (typeof body.action_config === "object" && body.action_config !== null) ? body.action_config : {};

      const insertResult = await upsertTenantRule(env, tenantId, name, enabled, priority, condition, action, actionConfig);
      if (!insertResult) return jsonError(500, "Failed to save rule");

      // Invalidate rules cache
      rulesCache.delete(tenantId);

      // Write Audit Log
      try {
          await writeAuditLog(env, tenantId, "policy_created", "dashboard_user", name, "SUCCESS", { condition, action });
      } catch (e) { console.error("Audit log error:", e); }

      return Response.json({ success: true }, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "DELETE" && pathname === "/v1/rules") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const planRaw = await env.KV.get(`tenant:plan:${tenantId}`);
      let isPro = false;
      if (planRaw) {
        try {
          const planData = JSON.parse(planRaw);
          if (planData.plan === "pro" || planData.plan === "enterprise") isPro = true;
        } catch (e) {}
      }
      if (!isPro) return jsonError(403, "Upgrade Required: Custom Anomaly Rules are only available on the Pro or Enterprise plan.");

      const url = new URL(request.url);
      const ruleId = url.searchParams.get("id");
      if (!ruleId) return jsonError(400, "Missing rule id parameter");

      const parsedRuleId = safeParseInt(ruleId, -1);
      if (parsedRuleId < 0) return jsonError(400, "Invalid rule id");
      const deleteResult = await deleteTenantRule(env, tenantId, parsedRuleId);
      if (!deleteResult) return jsonError(500, "Failed to delete rule");

      rulesCache.delete(tenantId);

      // Write Audit Log
      try {
          await writeAuditLog(env, tenantId, "policy_deleted", "dashboard_user", `rule_${parsedRuleId}`, "SUCCESS");
      } catch (e) { console.error("Audit log error:", e); }

      return Response.json({ success: true }, { status: 200, headers: corsHeaders(env) });
    }

    // Data Residency — Enterprise only
    if (request.method === "GET" && pathname === "/v1/residency") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      const residencyPlan = await getTenantPlan(tenantId, env);

      const residencyData = env.SUPABASE_URL
        ? await callRpc(env, "get_tenant_residency", tenantId)
        : null;

      return Response.json(residencyData || parseResidencyFromJson({ tenant_id: tenantId }), {
        status: 200,
        headers: corsHeaders(env),
      });
    }

    if (request.method === "POST" && pathname === "/v1/residency") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      const residencyPlan2 = await getTenantPlan(tenantId, env);

      let body: Record<string, unknown>;
      try { body = await request.json() as Record<string, unknown>; } catch { return jsonError(400, "Invalid JSON"); }

      const region = typeof body.region === "string" ? body.region : "global";
      if (!["global", "eu", "us", "apac"].includes(region)) return jsonError(400, "region must be global, eu, us, or apac");

      const enforced = body.data_residency_enforced === true;
      const fallback = body.eu_fallback_allowed === true;

      const upsertResult = await upsertTenantResidency(env, tenantId, region, enforced, fallback);
      if (!upsertResult) return jsonError(500, "Failed to save residency config");

      return Response.json({ success: true }, { status: 200, headers: corsHeaders(env) });
    }

    // SSO / SAML Authentication — GATED: requires SSO_ENABLED=true AND Enterprise plan
    if (request.method === "GET" && pathname === "/v1/sso/saml/init") {
      if (env.SSO_ENABLED !== "true") {
        return jsonError(501, "SSO/SAML is experimental and not enabled. Set SSO_ENABLED=true to activate.");
      }
      const url = new URL(request.url);
      const tenantId = url.searchParams.get("tenant_id");
      if (!tenantId) return jsonError(400, "Missing tenant_id parameter");

      const ssoPlanData = await getTenantPlan(tenantId, env);
      if (ssoPlanData.plan !== "enterprise") {
        return jsonError(403, "SSO requires Enterprise plan.");
      }

      const samlConfig = env.SUPABASE_URL
        ? await callRpc(env, "get_tenant_saml_config", tenantId)
        : null;

      if (!samlConfig || samlConfig === null) {
        return jsonError(404, "SSO not configured for this tenant");
      }

      const config = samlConfig as unknown as SamlConfig;
      const acsUrl = config.sp_acs_url || `${url.origin}/v1/sso/saml/acs`;
      const { redirectUrl, requestId } = generateAuthnRequest(config.sp_entity_id || `agentwatch-${tenantId}`, acsUrl);

      // Store requestId in KV for InResponseTo validation (5-min TTL)
      await env.KV.put(`saml_request:${requestId}`, tenantId, { expirationTtl: 300 });

      // Validate IdP URL uses HTTPS to prevent open redirect
      try {
        const idpUrl = new URL(config.idp_sso_url);
        if (idpUrl.protocol !== "https:") {
          return jsonError(400, "SSO configuration error: IdP URL must use HTTPS");
        }
      } catch {
        return jsonError(400, "SSO configuration error: Invalid IdP URL");
      }

      // Redirect to IdP
      return Response.redirect(`${config.idp_sso_url}${config.idp_sso_url.includes("?") ? "&" : "?"}SAMLRequest=${encodeURIComponent(redirectUrl.replace("?SAMLRequest=", ""))}`, 302);
    }

    if (request.method === "POST" && pathname === "/v1/sso/saml/acs") {
      if (env.SSO_ENABLED !== "true") {
        return jsonError(501, "SSO/SAML is experimental and not enabled.");
      }
      const formData = await request.formData();
      const samlResponse = formData.get("SAMLResponse") as string | null;

      if (!samlResponse) {
        return jsonError(400, "Missing SAMLResponse");
      }

      // Extract tenant_id from RelayState to fetch SAML config
      const relayState = formData.get("RelayState") as string | null;
      if (!relayState) {
        return jsonError(400, "Missing RelayState in SAML response");
      }
      const tenantId = relayState;

      // Fetch SAML config to get IdP certificate for signature verification
      const samlConfigRaw = env.SUPABASE_URL
        ? await callRpc(env, "get_tenant_saml_config", tenantId)
        : null;

      if (!samlConfigRaw) {
        return jsonError(400, "SSO not configured for this tenant");
      }

      const samlCfg = samlConfigRaw as unknown as SamlConfig;
      const { success, subject, sessionIndex, inResponseTo, error } = parseSamlResponse(samlResponse, samlCfg.idp_certificate);

      // Validate InResponseTo against stored requestId (replay protection)
      if (!inResponseTo) {
        return jsonError(401, "SSO authentication failed: Missing InResponseTo (replay protection required)");
      }
      {
        const storedTenantId = await env.KV.get(`saml_request:${inResponseTo}`);
        if (!storedTenantId) {
          return jsonError(401, "SSO authentication failed: Invalid or expired request");
        }
        // Verify the stored tenant matches the RelayState tenant to prevent cross-tenant auth bypass
        if (storedTenantId !== tenantId) {
          return jsonError(401, "SSO authentication failed: Tenant mismatch");
        }
        // Delete used requestId (single-use)
        await env.KV.delete(`saml_request:${inResponseTo}`);
      }

      if (!success) {
        const safeError = escapeHtml(error || "Unknown error");
        const html = `<!DOCTYPE html><html><head><title>SSO Error</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"></head><body style="font-family:system-ui;max-width:600px;margin:60px auto;padding:20px;background:#080A12;color:#e4e4e7">
<h2 style="color:#ef4444">SSO Authentication Failed</h2>
<p style="color:#a1a1aa">${safeError}</p>
<a href="/login" style="color:#58A6FF">Return to Login</a>
</body></html>`;
        return new Response(html, {
          status: 401,
          headers: { "Content-Type": "text/html", ...securityHeaders() },
        });
      }

      // Map subject to tenant
      if (samlCfg && subject) {
        const mappedTenant = mapSubjectToTenant(subject, samlCfg);

        if (mappedTenant) {
          // Generate session token
          const sessionToken = `aw_sso_${crypto.randomUUID().replace(/-/g, "")}`;

          // Store session in KV
          ctx.waitUntil(
            (async () => {
              await env.KV.put(`tenant:token:${sessionToken}`, JSON.stringify({
                tenantId: mappedTenant,
                subject,
                sessionIndex,
                authMethod: "saml_sso",
                createdAt: new Date().toISOString(),
              }), { expirationTtl: 86400 });
            })()
          );

          const html = `<!DOCTYPE html><html><head><title>SSO Login Successful</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"></head><body style="font-family:system-ui;max-width:600px;margin:60px auto;padding:20px;background:#080A12;color:#e4e4e7">
<h2 style="color:#22c55e">SSO Login Successful</h2>
<p>Redirecting to dashboard...</p>
<script>
(function() {
  var token = "${sessionToken.replace(/"/g, '\\"')}";
  var tenant = "${mappedTenant.replace(/"/g, '\\"')}";
  window.location.replace("/login?oauth_token=" + encodeURIComponent(token) + "&oauth_tenant=" + encodeURIComponent(tenant));
})();
</script>
</body></html>`;
          return new Response(html, {
            status: 200,
            headers: { "Content-Type": "text/html", ...securityHeaders() },
          });
        }
      }

      return jsonError(401, "SSO authentication failed");
    }
    // EU AI Act Compliance Report
    if (request.method === "GET" && pathname === "/v1/compliance/report") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const url = new URL(request.url);
      const days = safeParseInt(url.searchParams.get("days"), 30);
      const format = url.searchParams.get("format") || "json";

      const reportData = env.SUPABASE_URL
        ? await callRpc(env, "generate_compliance_report", tenantId, days)
        : null;

      if (!reportData) return jsonError(500, "Failed to generate compliance report");

      if (format === "html") {
        const html = generateReportHtml(reportData as unknown as ComplianceReport);
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders(env), ...securityHeaders() },
        });
      }

      return Response.json(reportData, { status: 200, headers: corsHeaders(env) });
    }

    // SLA Monitoring Report
    if (request.method === "GET" && pathname === "/v1/dashboard/sla") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const planData = await getTenantPlan(tenantId, env);
      const plan = planData.plan;
      if (plan === "free") {
        return jsonError(403, "SLA Monitoring is only available on the Pro or Enterprise plan.");
      }

      const url = new URL(request.url);
      const days = safeParseInt(url.searchParams.get("days"), 30);
      const format = url.searchParams.get("format") || "json";

      const slaRecords = env.SUPABASE_URL
        ? await callRpc(env, "get_sla_records", tenantId, days)
        : [];

      const { getSlaConfig, generateSlaReport, generateSlaReportHtml } = await import("./sla");
      const config = getSlaConfig(plan);
      const report = generateSlaReport(tenantId, (Array.isArray(slaRecords) ? slaRecords as UptimeRecord[] : []), config);

      if (format === "html") {
        const html = generateSlaReportHtml(report);
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders(env), ...securityHeaders() },
        });
      }

      return Response.json(report, { status: 200, headers: corsHeaders(env) });
    }

    // Analytics: Request volume (last 24 hours by hour)
    if (request.method === "GET" && pathname === "/v1/dashboard/analytics/volume") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const result = env.SUPABASE_URL
        ? await callRpc(env, "get_request_volume_by_hour", tenantId)
        : null;

      // Fallback: if Supabase not configured, return mock data
      const volume = result || Array.from({ length: 24 }, (_, i) => ({
        hour: new Date(Date.now() - (23 - i) * 3600000).toISOString().slice(0, 13) + ":00",
        count: Math.floor(Math.random() * 100) // Mock data: random values when Supabase is not configured
      }));

      return Response.json({ hourly: volume }, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "POST" && pathname === "/v1/contact") {
      // Rate limit contact form using native RateLimiter
      const contactIp = request.headers.get("cf-connecting-ip") || "unknown";
      if (env.RATE_LIMITER) {
        const { success } = await env.RATE_LIMITER.limit({ key: `contact:${contactIp}` });
        if (!success) return jsonError(429, "Too many requests. Please try again later.");
      }

      let body: Record<string, unknown>;
      try { body = await request.json() as Record<string, unknown>; } catch { return jsonError(400, "Invalid JSON"); }

      const name = typeof body.name === "string" ? body.name.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const company = typeof body.company === "string" ? body.company.trim() : "Not specified";
      const spend = typeof body.spend === "string" ? body.spend.trim() : "";
      const plan = typeof body.plan === "string" ? body.plan.trim() : "unknown";

      if (!name || !email) {
        return jsonError(400, "name and email are required");
      }

      if (!env.RESEND_API_KEY) {
        return jsonError(500, "Email service not configured");
      }

      const html = getContactEmailHtml(name, email, company, spend, plan);

      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: env.REPORT_FROM_EMAIL || `AgentWatch <hello@${env.SITE_URL || "localhost:8787"}>`,
            to: [env.CONTACT_EMAIL || (env.SITE_URL ? `admin@${new URL(env.SITE_URL).hostname}` : "admin@localhost")],
            replyTo: email,
            subject: `AgentWatch Access Request — ${company}`,
            html,
          }),
        });

        if (!resp.ok) {
          console.error("AgentWatch contact email failed", resp.status);
          return jsonError(500, "Failed to send message");
        }

        ctx.waitUntil(logApiAccess(env, "__system", "contact_submit", "/v1/contact", "POST", request, 200, { email }));

        return Response.json({ success: true }, { status: 200, headers: corsHeaders(env) });
      } catch (err) {
        console.error("AgentWatch contact email error", err);
        return jsonError(500, "Failed to send message");
      }
    }

    // Newsletter subscribe
    if (request.method === "POST" && pathname === "/v1/newsletter/subscribe") {
      let body: Record<string, unknown>;
      try { body = await request.json() as Record<string, unknown>; } catch { return jsonError(400, "Invalid JSON"); }

      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!email || !email.includes("@")) return jsonError(400, "Valid email required");

      // Store in KV with 1-year TTL
      await env.KV.put(`newsletter:${email}`, JSON.stringify({ email, subscribedAt: new Date().toISOString() }), { expirationTtl: 365 * 24 * 60 * 60 });

      ctx.waitUntil(logApiAccess(env, "__system", "newsletter_subscribe", "/v1/newsletter/subscribe", "POST", request, 200, { email }));

      return Response.json({ success: true }, { status: 200, headers: corsHeaders(env) });
    }

    if (request.method === "GET" && pathname === "/v1/budget-check") {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get("session_id");
      const limitUsdRaw = parseFloat(url.searchParams.get("limit_usd") || "0");
      const limitUsd = Number.isFinite(limitUsdRaw) && limitUsdRaw >= 0 ? limitUsdRaw : 0;
      if (!sessionId) return jsonError(400, "Missing session_id");

      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") {
        return jsonError(500, "Tenant token map is not valid JSON.");
      }
      if (!tenantId) {
        return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      }

      const team = url.searchParams.get("team") || request.headers.get("x-agentwatch-team") || "default";
      if (!(await checkRateLimit(tenantId, team, env))) {
        return jsonError(429, "Rate limit exceeded. Try again later.");
      }

      const sessionKey = `t:${tenantId}:s:${sessionId}:tokens`;
      const currentTotalTokens = parseInt(await env.KV.get(sessionKey) || "0", 10);
      const usdKey = `t:${tenantId}:s:${sessionId}:usd`;
      const spentUsd = parseFloat(await env.KV.get(usdKey) || "0");

      const exceeded = limitUsd > 0 && spentUsd >= limitUsd;

      ctx.waitUntil(logApiAccess(env, tenantId, exceeded ? "budget_enforce_blocked" : "budget_check", "/v1/budget-check", "GET", request, 200, { session_id: sessionId, exceeded }));

      return new Response(JSON.stringify({
        exceeded,
        spent_usd: spentUsd,
        limit_usd: limitUsd,
        cumulative_tokens: currentTotalTokens
      }), { status: 200, headers: { "content-type": "application/json", ...corsHeaders(env) } });
    }

    if (request.method === "POST" && pathname === "/v1/estimate-cost") {
      let body: Record<string, unknown>;
      try { body = await request.json() as Record<string, unknown>; } catch { return jsonError(400, "Invalid JSON body"); }

      const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : null;
      if (!model) return jsonError(400, "model is required");

      let promptTokens = typeof body.prompt_tokens === "number" && Number.isFinite(body.prompt_tokens) && body.prompt_tokens >= 0 ? Math.floor(body.prompt_tokens) : -1;
      let completionTokens = typeof body.completion_tokens === "number" && Number.isFinite(body.completion_tokens) && body.completion_tokens >= 0 ? Math.floor(body.completion_tokens) : -1;

      if (promptTokens < 0 && Array.isArray(body.messages)) {
        promptTokens = estimateMessagesTokens(body.messages, model);
      }
      if (promptTokens < 0 && typeof body.prompt === "string") {
        promptTokens = estimateTextTokens(body.prompt, model);
      }
      if (promptTokens < 0) promptTokens = 0;
      if (completionTokens < 0) completionTokens = 0;

      let pricing = EXACT_MATCH_PRICING[model];
      let matchedVia: string | null = null;
      if (!pricing) {
        for (const rule of FUZZY_MATCH_PRICING) {
          if (rule.operator === "includes" && model.includes(rule.model)) { pricing = rule; matchedVia = `includes:${rule.model}`; break; }
          if (rule.operator === "startsWith" && model.startsWith(rule.model)) { pricing = rule; matchedVia = `startsWith:${rule.model}`; break; }
        }
      } else {
        matchedVia = "exact";
      }

      const promptCost = pricing ? (promptTokens / 1_000_000) * pricing.prompt : 0;
      const completionCost = pricing ? (completionTokens / 1_000_000) * pricing.completion : 0;

      return Response.json({
        model,
        price_found: !!pricing,
        matched_via: matchedVia,
        pricing: pricing ? {
          prompt_cost_per_1m: pricing.prompt,
          completion_cost_per_1m: pricing.completion,
          prompt_cache_write_per_1m: pricing.prompt_cache_write,
          prompt_cache_read_per_1m: pricing.prompt_cache_read,
        } : null,
        cost: {
          prompt: Number(promptCost.toFixed(10)),
          completion: Number(completionCost.toFixed(10)),
          total: Number((promptCost + completionCost).toFixed(10)),
        },
        tokens: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        },
      }, { status: 200, headers: { "content-type": "application/json", ...corsHeaders(env) } });
    }

    // Pre-execution Cost Estimation
    if (request.method === "POST" && pathname === "/v1/cost/estimate") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      let body: { steps: Array<{ model: string; prompt_tokens?: number; completion_tokens?: number; provider?: string }> };
      try { body = await request.json() as typeof body; } catch { return jsonError(400, "Invalid JSON"); }

      // Accept a workflow description: array of steps with model and token estimates
      // Each step: { model: string, prompt_tokens?: number, completion_tokens?: number, provider?: string }
      const steps = Array.isArray(body.steps) ? body.steps : [];
      if (steps.length === 0) {
        return jsonError(400, "Provide 'steps' array with model and token estimates");
      }

      let totalCostUsd = 0;
      const stepEstimates: Array<{ model: string; prompt_tokens: number; completion_tokens: number; estimated_cost_usd: number }> = [];

      for (const step of steps) {
        const model = typeof step.model === "string" ? step.model : "unknown";
        const promptTokens = typeof step.prompt_tokens === "number" ? step.prompt_tokens : 1000;
        const completionTokens = typeof step.completion_tokens === "number" ? step.completion_tokens : 500;
        const cost = calculateCost(promptTokens, completionTokens, model);
        totalCostUsd += cost;
        stepEstimates.push({ model, prompt_tokens: promptTokens, completion_tokens: completionTokens, estimated_cost_usd: cost });
      }

      return Response.json({
        total_estimated_cost_usd: totalCostUsd,
        step_count: steps.length,
        steps: stepEstimates,
      }, { status: 200, headers: corsHeaders(env) });
    }

    if (pathname === "/docs") {
      return Response.redirect(`${env.SITE_URL || "http://localhost:8787"}/docs`, 302);
    }

    if (pathname === "/v1/admin/provision" && request.method === "POST") {
      if (!env.ADMIN_SECRET) {
        return jsonError(500, "ADMIN_SECRET is not configured on the server.");
      }
      
      const secret = request.headers.get("x-admin-secret");
      const adminKeyBuf = new TextEncoder().encode((secret || "").padEnd(256, "\0"));
      const expectedBuf = new TextEncoder().encode(env.ADMIN_SECRET.padEnd(256, "\0"));
      let validSecret = false;
      try {
        validSecret = !!secret && safeTimingEqual(adminKeyBuf, expectedBuf);
      } catch {
        return jsonError(500, "Security module unavailable.");
      }
      if (!validSecret) {
        return jsonError(401, "Invalid x-admin-secret header.");
      }

      let email: string;
      try {
        const body = await request.json() as { email?: string };
        if (!body.email) throw new Error("Missing email");
        email = body.email;
      } catch {
        return jsonError(400, "Invalid JSON body. Please provide an 'email' field.");
      }

      try {
        const result = await provisionTenant(env, email);
        return new Response(JSON.stringify({ success: true, ...result }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders(env) }
        });
      } catch (err) {
        return jsonError(500, "Failed to provision tenant: " + String(err));
      }
    }

    if (pathname === "/v1/admin/budget" && request.method === "POST") {
      if (!env.ADMIN_SECRET) {
        return jsonError(500, "ADMIN_SECRET is not configured on the server.");
      }
      
      const secret = request.headers.get("x-admin-secret");
      const adminKeyBuf2 = new TextEncoder().encode((secret || "").padEnd(256, "\0"));
      const expectedBuf2 = new TextEncoder().encode(env.ADMIN_SECRET.padEnd(256, "\0"));
      let validSecret2 = false;
      try {
        validSecret2 = !!secret && safeTimingEqual(adminKeyBuf2, expectedBuf2);
      } catch {
        return jsonError(500, "Security module unavailable.");
      }
      if (!validSecret2) {
        return jsonError(401, "Invalid x-admin-secret header.");
      }

      let tenantId: string, team: string, monthlyBudgetUsd: number;
      let alertThresholdPct = 80;
      let hardStop = true;

      try {
        const body = await request.json() as { tenantId?: string; team?: string; monthlyBudgetUsd?: number; alertThresholdPct?: number; hardStop?: boolean };
        if (!body.tenantId || !body.team || typeof body.monthlyBudgetUsd !== "number") {
          throw new Error("Missing required fields");
        }
        tenantId = body.tenantId;
        team = body.team;
        monthlyBudgetUsd = body.monthlyBudgetUsd;
        if (typeof body.alertThresholdPct === "number") alertThresholdPct = body.alertThresholdPct;
        if (typeof body.hardStop === "boolean") hardStop = body.hardStop;
      } catch {
        return jsonError(400, "Invalid JSON body. Please provide tenantId, team, and monthlyBudgetUsd.");
      }

      const success = await upsertTeamBudget(env, tenantId, team, monthlyBudgetUsd, alertThresholdPct, hardStop);
      if (success) {
        return new Response(JSON.stringify({ success: true, message: "Budget configured successfully." }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders(env) }
        });
      } else {
        return jsonError(500, "Failed to configure budget in Supabase.");
      }
    }

    if (request.method === "POST" && pathname === "/v1/ingest") {
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        return jsonError(500, "Supabase config is missing.");
      }

      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") {
        return jsonError(500, "Tenant token map is not valid JSON.");
      }
      if (!tenantId) {
        return jsonError(401, "Missing or invalid AgentWatch bearer token.");
      }

      const team = request.headers.get("x-agentwatch-team") || "default";
      if (!(await checkRateLimit(tenantId, team, env))) {
        return jsonError(429, "Rate limit exceeded. Try again later.");
      }

      const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
      if (contentLength > MAX_INGEST_PAYLOAD_BYTES) {
        return jsonError(413, "Payload too large. Maximum size is 1MB.");
      }

      let rawBody: string;
      try {
        rawBody = await request.text();
      } catch {
        return jsonError(400, "Failed to read request body.");
      }

      if (rawBody.length > MAX_INGEST_PAYLOAD_BYTES) {
        return jsonError(413, "Payload too large. Maximum size is 1MB.");
      }

      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        return jsonError(400, "Invalid JSON payload.");
      }

      let sessionId = typeof payload.session_id === "string" ? sanitizeSessionId(payload.session_id) : null;
      let iterationIndex = typeof payload.iteration_index === "number" && Number.isFinite(payload.iteration_index) ? payload.iteration_index : null;
      let cumulativeTokens: number | null = null;
      let promptTokens = typeof payload.prompt_tokens === "number" && Number.isFinite(payload.prompt_tokens) && payload.prompt_tokens >= 0 ? Math.floor(payload.prompt_tokens) : 0;
      let completionTokens = typeof payload.completion_tokens === "number" && Number.isFinite(payload.completion_tokens) && payload.completion_tokens >= 0 ? Math.floor(payload.completion_tokens) : 0;

      if (sessionId) {
        const sessionKey = `t:${tenantId}:s:${sessionId}:tokens`;
        const currentTotal = parseInt(await env.KV.get(sessionKey) || "0", 10);
        cumulativeTokens = currentTotal + promptTokens + completionTokens;
        await env.KV.put(sessionKey, cumulativeTokens.toString(), { expirationTtl: 86400 });

        const usdKey = `t:${tenantId}:s:${sessionId}:usd`;
        const currentUsd = parseFloat(await env.KV.get(usdKey) || "0");
        const addedUsd = calculateCost(promptTokens, completionTokens, (payload.model as string) || null);
        await env.KV.put(usdKey, (currentUsd + addedUsd).toString(), { expirationTtl: 86400 });

        const historyKey = `t:${tenantId}:s:${sessionId}:history`;
        const historyStr = await env.KV.get(historyKey);
        let recentIterations: number[] = [];
        if (historyStr) {
          try { recentIterations = JSON.parse(historyStr); } catch { recentIterations = []; }
        }
        recentIterations.push(promptTokens);
        if (recentIterations.length > 5) {
          recentIterations = recentIterations.slice(-5);
        }
        await env.KV.put(historyKey, JSON.stringify(recentIterations), { expirationTtl: 86400 });

        if (recentIterations.length >= 4) {
          const growthRatios = recentIterations
            .slice(1)
            .map((tokens, i) => {
              const prev = recentIterations[i];
              return prev > 0 ? tokens / prev : 0;
            });

          const planRaw = await env.KV.get(`tenant:plan:${tenantId}`);
          let isPro = false;
          if (planRaw) {
            try {
              const planData = JSON.parse(planRaw);
              if (planData.plan === "pro" || planData.plan === "enterprise") isPro = true;
            } catch (e) {}
          }

          if (isPro) {
            const quadraticSignature = growthRatios
              .slice(-3)
              .every((ratio, i, arr) => ratio > 1.2 && (i === 0 || ratio > arr[i - 1]));

            if (quadraticSignature) {
              const alertKey = `t:${tenantId}:s:${sessionId}:alerted`;
              if (!(await env.KV.get(alertKey))) {
                await env.KV.put(alertKey, "1", { expirationTtl: 86400 });

                const slackPayload = JSON.stringify({
                  text: `🚨 *Runaway Agent Detected* 🚨\nSession \`${sessionId}\` showed quadratic growth signature.\nRecent prompt tokens: ${JSON.stringify(recentIterations)}`
                });

                if (env.SLACK_WEBHOOK_URL) {
                  // Background telemetry queue doesn't have ctx, but fetch is fire-and-forget
                  fetch(env.SLACK_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: slackPayload
                  }).catch(() => {});
                }
                
                // Dispatch to Tenant Webhook
                dispatchTenantWebhook(env, tenantId, slackPayload).catch(() => {});
              }
            }
          }
        }
      }

      try {
        const rawRisks = Array.isArray(payload.identified_risks) ? payload.identified_risks : [];
        const sanitizedRisks: string[] = Array.from(new Set(
          rawRisks.filter((tag: unknown): tag is string => typeof tag === "string" && VALID_RISK_TAGS.has(tag))
        ));

        // Evaluate custom anomaly rules and tag the log record
        const now = new Date();
        const ruleCtx: RequestContext = {
          model: typeof payload.model === "string" ? payload.model : null,
          provider: typeof payload.provider === "string" && ALLOWED_PROVIDERS.has(payload.provider) ? payload.provider : "openai",
          team: typeof payload.team === "string" ? payload.team : null,
          project: typeof payload.project === "string" ? payload.project : null,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          hour_utc: now.getUTCHours(),
          day_of_week: now.getUTCDay(),
        };
        const tenantRules = await getTenantRules(env, tenantId);
        const ruleResult = evaluateRules(tenantRules, ruleCtx);
        if (ruleResult.matched && ruleResult.tag) {
          sanitizedRisks.push(`RULE_${ruleResult.tag}`);
        }
        if (ruleResult.matched && ruleResult.action === "block") {
          // For ingest, block rules log the violation but don't reject (the call already happened)
          sanitizedRisks.push(`RULE_BLOCKED:${ruleResult.rule_name}`);
        }

        const providerStr = typeof payload.provider === "string" && ALLOWED_PROVIDERS.has(payload.provider) ? payload.provider : "openai";

        const sanitizedRecord: LogRecord = {
          tenant_id: tenantId,
          provider: providerStr as Provider,
          upstream_path: typeof payload.upstream_path === "string" ? payload.upstream_path.slice(0, 255) : "/v1/chat/completions",
          model: typeof payload.model === "string" && payload.model.length > 0 ? payload.model.slice(0, 255) : "unknown",
          request_started_at: new Date().toISOString(),
          response_status: 200,
          is_stream: false,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          upstream_ttfb_ms: typeof payload.latency_ms === "number" && Number.isFinite(payload.latency_ms) ? payload.latency_ms : 0,
          total_latency_ms: typeof payload.latency_ms === "number" && Number.isFinite(payload.latency_ms) ? payload.latency_ms : 0,
          proxy_overhead_ms: 0, // Ingest endpoint has no proxy overhead
          upstream_request_id: null,
          identified_risks: sanitizedRisks,
          project: typeof payload.project === "string" ? payload.project.slice(0, 100) : null,
          team: typeof payload.team === "string" ? payload.team.slice(0, 100) : null,
          session_id: sessionId,
          iteration_index: iterationIndex,
          cumulative_tokens_in_session: cumulativeTokens,
          error: null
        };

        ctx.waitUntil(writeSupabaseLog(env, sanitizedRecord));
        ctx.waitUntil(logApiAccess(env, tenantId, "ingest", "/v1/ingest", "POST", request, 200, { session_id: sessionId }));

        return new Response("Success", { status: 200, headers: { "content-type": "text/plain" } });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "content-type": "application/json" } });
      }
    }

    if (request.method === "GET" && pathname === "/v1/dashboard/plan") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const planData = await getTenantPlan(tenantId, env);
      const plan = planData.plan;
      const fallbackPolicy = planData.fallbackPolicy;
      const requestCount = await getMonthlyRequestCount(tenantId, env);
      const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

      return Response.json({
        plan,
        requestCount,
        requestLimit: limit,
        requestsRemaining: limit === Infinity ? -1 : Math.max(0, limit - requestCount),
        pricing: {
          proPriceUsd: 99,
          proRequestLimit: 500000,
          freeRequestLimit: 50000,
        },
      }, { status: 200, headers: corsHeaders(env) });
    }

    // Payment History
    if (request.method === "GET" && pathname === "/v1/dashboard/payments") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      let payments: Record<string, unknown>[] = [];

      return Response.json({ payments }, { status: 200, headers: corsHeaders(env) });
    }

    // SSO Status (Enterprise only)
    if (request.method === "GET" && pathname === "/v1/dashboard/sso-status") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const planRaw = await env.KV.get(`tenant:plan:${tenantId}`);
      let plan = "free";
      if (planRaw) {
        try { plan = JSON.parse(planRaw).plan || "free"; } catch {}
      }
      if (plan !== "enterprise") {
        return jsonError(403, "SSO Status requires Enterprise plan.");
      }

      // Check if tenant has SAML config in Supabase
      let configured = false;
      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const samlConfig = await callRpc(env, "get_tenant_saml_config", tenantId);
          configured = !!(samlConfig && samlConfig !== null && (samlConfig as SamlConfig).idp_sso_url);
        } catch {}
      }

      return Response.json({ configured, enabled: false }, { status: 200, headers: corsHeaders(env) });
    }

    // SOC 2 Compliance Evidence Export (Enterprise only)
    if (request.method === "GET" && pathname === "/v1/dashboard/compliance/soc2") {
      const tenantId = await authenticateTenantId(request, env);
      if (tenantId === "CONFIG_ERROR") return jsonError(500, "Tenant token map is not valid JSON.");
      if (!tenantId) return jsonError(401, "Missing or invalid AgentWatch bearer token.");

      const planRaw = await env.KV.get(`tenant:plan:${tenantId}`);
      let isEnterprise = false;
      if (planRaw) {
        try {
          const planData = JSON.parse(planRaw);
          if (planData.plan === "enterprise") isEnterprise = true;
        } catch (e) {}
      }
      if (!isEnterprise) {
        return jsonError(403, "SOC 2 Compliance Exports are only available on the Enterprise plan.");
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      let accessLogs: Soc2Export["accessLogs"] = [];
      let authEvents: Soc2Export["authEvents"] = [];

      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        const [accessResp, authResp] = await Promise.all([
          fetch(`${env.SUPABASE_URL}/rest/v1/api_access_log?tenant_id=eq.${tenantId}&created_at=gte.${thirtyDaysAgo}&order=created_at.desc&limit=100`, {
            headers: supabaseHeaders(env)
          }),
          fetch(`${env.SUPABASE_URL}/rest/v1/auth_events?tenant_id=eq.${tenantId}&created_at=gte.${thirtyDaysAgo}&order=created_at.desc&limit=100`, {
            headers: supabaseHeaders(env)
          })
        ]);

        if (accessResp.ok) {
          const raw = await accessResp.json() as Array<Record<string, unknown>>;
          accessLogs = raw.map(r => ({
            id: String(r.id || ""),
            timestamp: String(r.created_at || ""),
            action: String(r.action || ""),
            ip: String(r.ip || "unknown"),
            user_agent: String(r.user_agent || ""),
            status: Number(r.status) || 200
          }));
        }

        if (authResp.ok) {
          const raw = await authResp.json() as Array<Record<string, unknown>>;
          authEvents = raw.map(r => ({
            id: String(r.id || ""),
            timestamp: String(r.created_at || ""),
            event_type: String(r.event_type || ""),
            subject: r.subject ? String(r.subject) : null,
            ip: r.ip ? String(r.ip) : null,
            metadata: (typeof r.metadata === "object" && r.metadata !== null) ? r.metadata as Record<string, unknown> : {}
          }));
        }
      }

      const uniqueIps = new Set(accessLogs.map(l => l.ip)).size;
      const failedAuthAttempts = authEvents.filter(e => e.event_type.includes("failure") || e.event_type.includes("failed")).length;
      const dbSettings = (env.SUPABASE_URL ? await callRpc(env, "get_tenant_settings", tenantId) : null) as Record<string, unknown> | null;
      const retentionDays = (dbSettings?.data_retention_days as number) ?? 30;

      const report: Soc2Export = {
        tenantId,
        generatedAt: now.toISOString(),
        periodStart: thirtyDaysAgo,
        periodEnd: now.toISOString(),
        controls: [
          { control: "CC6.1", category: "Logical Access", status: "implemented", evidence: "API keys are scoped per-tenant with role-based access. Developer keys are restricted to assigned team ID.", lastVerified: now.toISOString() },
          { control: "CC6.2", category: "Logical Access", status: "implemented", evidence: "Supabase Auth provides email/password authentication with JWT token management.", lastVerified: now.toISOString() },
          { control: "CC6.3", category: "Logical Access", status: "implemented", evidence: "Key revocation deletes from both Supabase and edge KV instantly, cutting access within seconds.", lastVerified: now.toISOString() },
          { control: "CC6.6", category: "Logical Access", status: "implemented", evidence: "SSO/SAML integration available with IdP-initiated authentication and tenant mapping.", lastVerified: now.toISOString() },
          { control: "CC7.2", category: "Monitoring", status: "implemented", evidence: "Real-time monitoring of API access, auth events, risk events, and anomalous usage patterns.", lastVerified: now.toISOString() }
        ],
        accessLogs,
        authEvents,
        dataRetention: {
          enabled: retentionDays > 0,
          retentionDays,
          policy: retentionDays > 0 ? `Logs retained for ${retentionDays} days. Auto-purge via database policy.` : "No retention policy configured."
        },
        summary: {
          totalAccessLogs: accessLogs.length,
          totalAuthEvents: authEvents.length,
          uniqueIps,
          failedAuthAttempts,
          controlsImplemented: 5,
          controlsTotal: 5
        }
      };

      const html = generateSoc2Export(report);
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders(env), ...securityHeaders() }
      });
    }

    if (request.method === "GET" && pathname === "/") {
      return new Response(loginHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders(env), ...securityHeaders() },
      });
    }

    const route = matchRoute(request.url, env, request.headers.get("x-agentwatch-residency") || undefined);
    if (!route) {
      if (pathname.includes("/v1/") || pathname.includes("/proxy/")) {
        return jsonError(404, `No AgentWatch proxy route matched this request. Ensure your Base URL is correct (e.g., ${env.SITE_URL || "http://localhost:8787"}/v1/proxy/gemini).`);
      }
      if (request.method === "GET") {
        const assetResponse = await env.ASSETS.fetch(request.url, request);
        if (assetResponse.status !== 404) {
          return assetResponse;
        }
      }
      const notFoundResponse = await env.ASSETS.fetch(new URL("/404.html", request.url)).catch(() => null);
      if (notFoundResponse && notFoundResponse.ok) {
        return new Response(notFoundResponse.body, { status: 404, headers: notFoundResponse.headers });
      }
      return jsonError(404, "No AgentWatch proxy route matched this request.");
    }

    const authResult = await authenticateTenant(request, env);
    if (authResult === "CONFIG_ERROR") {
      return jsonError(500, "Tenant token map is not valid JSON.");
    }

    if (!authResult) {
      return jsonError(401, "Missing or invalid AgentWatch bearer token.");
    }

    const tenantId = authResult.tenantId;

    // Zero-latency balance check from edge KV
    const balanceOk = await env.KV.get(`tenant:balance_ok:${tenantId}`);
    if (balanceOk === "false") {
      return jsonError(402, "Insufficient credits. Please add credits in the billing dashboard.");
    }

    const plan = authResult.plan || "free";
    const requestCount = await incrementMonthlyRequests(tenantId, env);
    const planLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    if (requestCount > planLimit) {
      return jsonError(429, `Monthly request limit exceeded for ${plan} plan (${planLimit} requests/mo). Upgrade at /dashboard.`);
    }

    const customerApiKey = authResult.customerApiKey;

    // Team isolation: use the team from the token record only. Ignore client header.
    const team = authResult.teamId || "default";
    if (!(await checkRateLimit(tenantId, team, env))) {
      return jsonError(429, "Rate limit exceeded for team. Try again later.");
    }

    const configError = validateRuntimeConfig(route.provider, env, customerApiKey);
    if (configError) {
      return jsonError(500, configError);
    }

    const requestStartedAt = new Date();
    const startMs = Date.now();
    let proxyOverheadMs = 0; // Track proxy-only latency
    const requestForLogging = request.clone();
    const capturedPayload = capturePayload(requestForLogging);

    // Custom anomaly rules: evaluate tenant policies against request metadata
    const payloadData = await capturedPayload;
    const ruleCtx: RequestContext = {
      model: extractModel(payloadData.json),
      provider: route.provider,
      team: team,
      project: typeof (payloadData.json as Record<string, unknown>)?.project === "string"
        ? ((payloadData.json as Record<string, unknown>).project as string) : null,
      prompt_tokens: estimatePromptTokens(payloadData, route.provider, extractModel(payloadData.json)),
      completion_tokens: 0,
      hour_utc: requestStartedAt.getUTCHours(),
      day_of_week: requestStartedAt.getUTCDay(),
    };
    if (plan === "pro" || plan === "enterprise") {
      const tenantRules = await getTenantRules(env, tenantId);
      const ruleResult = evaluateRules(tenantRules, ruleCtx);
      const ruleBlockResponse = applyRuleResult(ruleResult);
      if (ruleBlockResponse) return ruleBlockResponse;
    }

    // Re-capture payload since we consumed it for rule evaluation
    const requestForProxy = request.clone();

    // Streaming budget enforcement
    const streamSessionId = request.headers.get("x-agentwatch-session-id");
    let streamBudgetUsd: number | null | "ERROR" = null;
    let streamCumulativeTokens = 0;

    if (streamSessionId) {
      // Per-session budget: check header first, fall back to team budget
      const headerBudgetUsd = parseFloat(request.headers.get("x-agentwatch-budget-usd") || "NaN");
      const sessionBudgetKey = `t:${tenantId}:s:${streamSessionId}:budget_usd`;

      if (!isNaN(headerBudgetUsd) && headerBudgetUsd > 0) {
        // Store per-session budget (first request sets it)
        const existingBudget = await env.KV.get(sessionBudgetKey);
        if (!existingBudget) {
          await env.KV.put(sessionBudgetKey, String(headerBudgetUsd), { expirationTtl: 86400 });
        }
        streamBudgetUsd = parseFloat(existingBudget || String(headerBudgetUsd));
      } else {
        // Fall back to team-level monthly budget
        streamBudgetUsd = await getTeamRemainingBudget(env, tenantId, ruleCtx.team);
      }

      if (streamBudgetUsd === "ERROR") {
        if (authResult.fallbackPolicy === "fail_closed") {
          return jsonError(402, `Budget check failed due to system timeout. Hard stop active. (Policy: fail_closed)`);
        }
      } else if (streamBudgetUsd !== null && streamBudgetUsd <= 0) {
        return jsonError(402, `Session budget exceeded. Hard stop active.`);
      }
      
      const doId = env.SESSION_TRACKER.idFromName(`t:${tenantId}:s:${streamSessionId}`);
      const doStub = env.SESSION_TRACKER.get(doId);
      try {
        const trackerResponse = await doStub.incrementTokensAndUsd(0, 0);
        streamCumulativeTokens = trackerResponse.tokens;
        if (trackerResponse.runaway_detected) {
            // Write explicit audit log before rejecting
            try {
                await writeAuditLog(
                    env, 
                    tenantId, 
                    "anomaly_detected", 
                    "system", 
                    streamSessionId, 
                    "BLOCKED", 
                    { reason: "Agent exceeded 50 requests in a single session", team: ruleCtx.team }
                );
            } catch (e) {
                console.error("Audit log error:", e);
            }
            return jsonError(429, `runaway_loop_detected: Agent exceeded maximum iteration threshold.`);
        }
      } catch {
        if (authResult.fallbackPolicy === "fail_closed") {
          return jsonError(402, `Session check failed due to system timeout. Hard stop active. (Policy: fail_closed)`);
        }
        streamCumulativeTokens = 0;
      }
      
      if (streamBudgetUsd !== null && streamBudgetUsd !== "ERROR") {
        const streamUsdKey = `t:${tenantId}:s:${streamSessionId}:usd`;
        const spentUsd = parseFloat(await env.KV.get(streamUsdKey) || "0");
        if (spentUsd >= streamBudgetUsd) {
          return jsonError(402, `Session budget exceeded: $${spentUsd.toFixed(4)} spent of $${streamBudgetUsd.toFixed(4)} limit`);
        }
      }
    }

    let upstreamResponse: Response | null = null;
    let upstreamTtfbMs: number = 0;
    let failoverUsed = false;
    let failoverReason: string | null = null;
    let isCacheHit = false;
    const requestForFailover = request.clone();

    // Cache lookup
    const payloadRecord = payloadData.json as Record<string, unknown> | null;
    const headerCacheEnabled = request.headers.get("x-agentwatch-cache") === "true";
    const settingsRaw = await env.KV.get(`tenant:settings:${tenantId}`);
    const tenantSettings = settingsRaw ? JSON.parse(settingsRaw) : {};
    const isCacheEnabled = (headerCacheEnabled || tenantSettings.cache_enabled === true)
      && (plan === "pro" || plan === "enterprise");
    const isStream = payloadRecord?.stream === true;
    let cacheKey: string | null = null;
    
    if (isCacheEnabled && !isStream && payloadData.rawText) {
      cacheKey = await generateCacheKey(tenantId, payloadData.rawText);
      const cachedData = await env.KV.get(cacheKey);
      if (cachedData) {
        upstreamResponse = new Response(cachedData, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "x-agentwatch-cache-status": "HIT",
            ...corsHeaders(env)
          }
        });
        proxyOverheadMs = Date.now() - startMs;
        upstreamTtfbMs = Date.now() - startMs;
        isCacheHit = true;
        // Tag as cache hit so telemetry knows to zero out cost
        if (!Array.isArray(payloadRecord?.identified_risks)) {
          if (payloadRecord) payloadRecord.identified_risks = [];
        }
        (payloadRecord?.identified_risks as string[] | undefined)?.push("CACHE_HIT");
      }
    }

    if (!isCacheHit) {
      try {
        proxyOverheadMs = Date.now() - startMs; // Time spent in AgentWatch before upstream call
        upstreamResponse = await fetch(await buildUpstreamRequest(request, route, env, customerApiKey, payloadData.rawText));
        upstreamTtfbMs = Date.now() - startMs;

        if (cacheKey && upstreamResponse.status === 200) {
          // Asynchronously cache the response body
          const responseClone = upstreamResponse.clone();
          ctx.waitUntil((async () => {
             const bodyText = await responseClone.text();
             await env.KV.put(cacheKey as string, bodyText, { expirationTtl: 86400 }); // 24 hours
          })());
          
          upstreamResponse = new Response(upstreamResponse.body, upstreamResponse);
          upstreamResponse.headers.set("x-agentwatch-cache-status", "MISS");
        }
      } catch (error) {
        const totalLatencyMs = Date.now() - startMs;
        ctx.waitUntil(
          logFailedExchange({
            capturedPayload,
            env,
            error: error instanceof Error ? error.message : String(error),
            requestStartedAt,
            route,
            tenantId,
            totalLatencyMs,
          }),
        );
        return jsonError(502, "Upstream LLM provider request failed.");
      }
    }
    
    if (!upstreamResponse) {
      return jsonError(502, "Upstream LLM provider request failed (no response generated).");
    }

    const responseForLogging = upstreamResponse.clone();

    ctx.waitUntil(
      logCompletedExchange({
        capturedPayload,
        env,
        requestStartedAt,
        response: responseForLogging,
        route,
        tenantId,
        teamId: ruleCtx.team,
        sessionId: streamSessionId,
        upstreamTtfbMs,
        startMs,
        proxyOverheadMs,
      }),
    );

    ctx.waitUntil(logApiAccess(env, tenantId, "proxy_request", route.upstreamPath, "POST", request, upstreamResponse.status, { provider: route.provider }));

    if (streamSessionId && streamBudgetUsd !== null && streamBudgetUsd !== "ERROR") {
      const body = wrapStreamWithBudget(upstreamResponse, streamSessionId, streamBudgetUsd, streamCumulativeTokens, tenantId, route.provider, ruleCtx.model, env, ctx, authResult.fallbackPolicy || "fail_open");
      const proxyHeaders = new Headers(upstreamResponse.headers);
      for (const [k, v] of Object.entries(corsHeaders(env))) {
        proxyHeaders.set(k, v);
      }
      return new Response(body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: proxyHeaders,
      });
    }

    {
      const proxyHeaders = new Headers(upstreamResponse.headers);
      for (const [k, v] of Object.entries(corsHeaders(env))) {
        proxyHeaders.set(k, v);
      }
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: proxyHeaders,
      });
    }
    } catch (error) {
      console.error("AgentWatch fetch error:", error);
      const errorResponse = await env.ASSETS.fetch(new URL("/500.html", request.url)).catch(() => null);
      if (errorResponse && errorResponse.ok) {
        return new Response(errorResponse.body, { status: 500, headers: errorResponse.headers });
      }
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "content-type": "application/json" } });
    }
  },

  // MessageBatch generic is unknown due to Cloudflare Workers queue handler typing
  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        await writeSupabaseLogDirect(env, msg.body as LogRecord);
        msg.ack();
      } catch (err) {
        console.error("AgentWatch Queue sync error", err);
        msg.retry();
      }
    }
  }
};

export default worker;

function matchRoute(rawUrl: string, env: Env, residencyHeader?: string): RouteMatch | null {
  const url = new URL(rawUrl);
  const prefix = "/v1/proxy/";

  if (!url.pathname.startsWith(prefix)) {
    return null;
  }

  const rest = url.pathname.slice(prefix.length);
  const [providerSegment, ...pathParts] = rest.split("/").filter(Boolean);

  if (!ALLOWED_PROVIDERS.has(providerSegment)) {
    return null;
  }

  if (pathParts.length === 0) {
    pathParts.push("chat", "completions");
  }

  const provider = providerSegment as Provider;
  let upstreamPath = `/v1/${pathParts.join("/")}`;
  let baseUrl = OPENAI_DEFAULT_BASE_URL;

  if (provider === "azure") {
    // pathParts[0] is the resource name
    // e.g. /v1/proxy/azure/my-resource/openai/deployments/...
    const resourceName = pathParts[0];
    baseUrl = `https://${resourceName}.openai.azure.com`;
    // The upstream path for Azure doesn't use /v1 prefix, it's just /openai/deployments/...
    upstreamPath = `/${pathParts.slice(1).join("/")}`;
  } else if (provider === "bedrock") {
    // pathParts[0] is the region
    // e.g. /v1/proxy/bedrock/us-east-1/model/...
    const region = pathParts[0];
    // H7 fix: restrict to known AWS region patterns to prevent SSRF
    const BEDROCK_REGION_RE = /^(us|eu|ap|sa|ca|me|af|il)-(north|south|east|west|central|northeast|southeast|northwest|southwest)-\d$/;
    if (!BEDROCK_REGION_RE.test(region)) {
      return null; // Invalid region — reject the request
    }
    baseUrl = `https://bedrock-runtime.${region}.amazonaws.com`;
    upstreamPath = `/${pathParts.slice(1).join("/")}`;
  } else if (provider === "anthropic") baseUrl = env.ANTHROPIC_BASE_URL || ANTHROPIC_DEFAULT_BASE_URL;
  else if (provider === "groq") baseUrl = GROQ_DEFAULT_BASE_URL;
  else if (provider === "xai") baseUrl = XAI_DEFAULT_BASE_URL;
  else if (provider === "xiaomi") {
    baseUrl = XIAOMI_DEFAULT_BASE_URL;
    let finalParts = [...pathParts];
    while (finalParts[0] === "v1") finalParts.shift();
    upstreamPath = `/${finalParts.join("/")}`;
  }
  else if (provider === "gemini") {
    baseUrl = GEMINI_DEFAULT_BASE_URL;
    let finalParts = [...pathParts];
    while (finalParts[0] === "v1") finalParts.shift();
    upstreamPath = `/${finalParts.join("/")}`;
  }
  else if (provider === "mistral") baseUrl = MISTRAL_DEFAULT_BASE_URL;
  else if (provider === "cohere") baseUrl = COHERE_DEFAULT_BASE_URL;
  else if (provider === "openai") baseUrl = env.OPENAI_BASE_URL || OPENAI_DEFAULT_BASE_URL;

  // Data Residency: check header and override baseUrl if EU routing needed
  if (residencyHeader && residencyHeader !== "global") {
    const residencyConfig = { tenant_id: "", region: residencyHeader as "eu" | "us" | "apac", data_residency_enforced: true, eu_fallback_allowed: true };
    const residencyResult = getResidencyForProvider(residencyConfig, provider);
    if (residencyResult && residencyResult.baseUrl) {
      baseUrl = residencyResult.baseUrl;
    }
  }

  const upstreamUrl = new URL(`${baseUrl.replace(/\/+$/, "")}${upstreamPath}`);
  upstreamUrl.search = url.search;

  return {
    provider,
    upstreamPath,
    upstreamUrl: upstreamUrl.toString(),
  };
}

interface AuthResult {
  tenantId: string;
  customerApiKey: string | null;
  teamId?: string;
  plan?: string;
  fallbackPolicy?: "fail_open" | "fail_closed";
}

async function getTenantPlan(tenantId: string, env: Env): Promise<{ plan: string, fallbackPolicy: "fail_open" }> {
  const cached = await env.KV.get(`tenant:plan:${tenantId}`);
  if (cached) {
    try {
      const data = JSON.parse(cached);
      let plan = data.plan || "free";
      if (data.currentPeriodEnd && new Date(data.currentPeriodEnd) < new Date()) {
        plan = "free";
      }
      return { plan, fallbackPolicy: data.fallback_policy || "fail_open" };
    } catch { return { plan: "free", fallbackPolicy: "fail_open" }; }
  }
  return { plan: "free", fallbackPolicy: "fail_open" };
}

async function isProOrHigher(tenantId: string, env: Env): Promise<boolean> {
  return true;
}

async function incrementMonthlyRequests(tenantId: string, env: Env): Promise<number> {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const kvKey = `tenant:usage:${tenantId}:${monthKey}`;
  try {
    const current = parseInt(await env.KV.get(kvKey) || "0", 10);
    const next = current + 1;
    await env.KV.put(kvKey, String(next), { expirationTtl: 5184000 });
    return next;
  } catch {
    return 0;
  }
}

async function getMonthlyRequestCount(tenantId: string, env: Env): Promise<number> {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const kvKey = `tenant:usage:${tenantId}:${monthKey}`;
  return parseInt(await env.KV.get(kvKey) || "0", 10);
}

async function authenticateTenant(request: Request, env: Env): Promise<AuthResult | null | "CONFIG_ERROR"> {
  const rawToken = parseBearerToken(request.headers.get("authorization"));
  if (!rawToken || rawToken.length > 512) {
    return null;
  }

  // Combined Key (BYOK): split at first colon to extract AgentWatch token and customer's real API key
  const colonIndex = rawToken.indexOf(":");
  const awToken = colonIndex >= 0 ? rawToken.slice(0, colonIndex) : rawToken;
  const customerApiKey = colonIndex >= 0 ? rawToken.slice(colonIndex + 1) : null;

  // Global Kill Switch check
  const tokenPrefix = awToken.substring(0, 12) + "...";
  const isRevoked = await env.KV.get(`revoked:${tokenPrefix}`);
  if (isRevoked) return null;

  // Validate the customer key is not empty if a colon was present
  if (customerApiKey !== null && customerApiKey.length === 0) {
    return null;
  }

  // Try KV lookup first
  const kvResult = await env.KV.get(`tenant:token:${awToken}`);
  if (kvResult) {
    try {
      const record = JSON.parse(kvResult) as { tenantId: string, teamId?: string };
      if (typeof record.tenantId === "string" && record.tenantId.length > 0) {
        const planData = await getTenantPlan(record.tenantId, env);
        return { tenantId: record.tenantId, customerApiKey, teamId: record.teamId, plan: planData.plan, fallbackPolicy: planData.fallbackPolicy };
      }
    } catch {
      // Fall through to static map
    }
  }

  // Fall back to static TENANT_TOKEN_MAP
  const tenantTokens = getTenantTokens(env);
  if (!tenantTokens) {
    return null; // KV lookup was primary; TENANT_TOKEN_MAP is optional
  }

  const tenantId = constantTimeLookup(awToken, tenantTokens);
  if (!tenantId) return null;
  const planData = await getTenantPlan(tenantId, env);
  return { tenantId, customerApiKey, plan: planData.plan, fallbackPolicy: planData.fallbackPolicy };
}

// Backward-compatible helper: extracts just the tenantId string for non-proxy endpoints
// that don't need the customer's API key (budget-check, compliance, rules, etc.)
async function authenticateTenantId(request: Request, env: Env): Promise<string | null | "CONFIG_ERROR"> {
  const result = await authenticateTenant(request, env);
  if (result === "CONFIG_ERROR") return "CONFIG_ERROR";
  if (!result) return null;
  return result.tenantId;
}

function hasTimingSafeEqual(obj: unknown): obj is { timingSafeEqual(a: ArrayBufferView, b: ArrayBufferView): boolean } {
  return typeof obj === "object" && obj !== null && typeof (obj as Record<string, unknown>).timingSafeEqual === "function";
}

function safeTimingEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (hasTimingSafeEqual(crypto.subtle)) {
    return crypto.subtle.timingSafeEqual(a, b);
  }
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function constantTimeLookup(token: string, tokens: Map<string, string>): string | null {
  const encoder = new TextEncoder();
  const tokenBytes = encoder.encode(token);
  let matched: string | null = null;

  for (const [storedToken, tenantId] of tokens) {
    const storedBytes = encoder.encode(storedToken);
    // Always run timingSafeEqual even after a match to prevent timing leaks
    try {
      const isMatch = safeTimingEqual(tokenBytes, storedBytes);
      if (isMatch && !matched) {
        matched = tenantId;
      }
    } catch {
      // timingSafeEqual throws if lengths differ — that's fine, it's not a match
    }
  }

  return matched;
}

function parseBearerToken(header: string | null): string | null {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.trim().split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function getTenantTokens(env: Env): Map<string, string> | null {
  if (tenantCache && tenantCache.raw === env.TENANT_TOKEN_MAP) {
    return tenantCache.tokens;
  }

  const parsed = safeJsonParse(env.TENANT_TOKEN_MAP);
  if (!isRecord(parsed)) {
    return null;
  }

  const tokens = new Map<string, string>();

  for (const [token, tenantId] of Object.entries(parsed)) {
    if (typeof token === "string" && token.length > 0 && typeof tenantId === "string" && tenantId.length > 0) {
      tokens.set(token, tenantId);
    }
  }

  tenantCache = { raw: env.TENANT_TOKEN_MAP, tokens };
  return tokens;
}

function validateRuntimeConfig(provider: Provider, env: Env, customerApiKey?: string | null): string | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return "Supabase logging is not configured.";
  }

  // Enforce BYOK (customer must bring their own key)
  if (!customerApiKey) {
    return "AgentWatch Proxy: Missing upstream API key. You must pass your provider's API key via the aw_token header in the format aw_live_xxx:sk-xxx";
  }

  return null;
}

async function buildUpstreamRequest(request: Request, route: RouteMatch, env: Env, customerApiKey?: string | null, payloadText?: string | null): Promise<Request> {
  const headers = new Headers(request.headers);

  // Remove all potentially dangerous headers before forwarding to upstream provider.
  // Only explicitly safe headers are kept; everything else is stripped.
  const headersToDelete = [
    // Auth — replaced with provider-specific key
    "authorization",
    // Host — must match upstream, not client
    "host",
    // Content-Length — recalculated by fetch
    "content-length",
    // Cloudflare-specific — should not leak to upstream
    "cf-connecting-ip",
    "cf-ipcountry",
    "cf-ray",
    "cf-worker",
    "cf-ew-via",
    // Forwarding headers — can be spoofed for IP/origin poisoning
    "x-forwarded-for",
    "x-forwarded-proto",
    "x-forwarded-host",
    "x-real-ip",
    // AgentWatch internal headers — must not reach upstream
    "x-agentwatch-session-id",
    "x-agentwatch-budget-usd",
    // Cookies — session cookies from our domain must not leak upstream
    "cookie",
    // Transfer encoding — can cause request smuggling
    "transfer-encoding",
    // Request ID — could poison upstream logging
    "x-request-id",
    "x-amzn-requestid",
  ];

  for (const h of headersToDelete) {
    headers.delete(h);
  }

  // BYOK: Use customer's own API key
  if (route.provider === "anthropic") {
    headers.set("x-api-key", customerApiKey as string);
    if (!headers.has("anthropic-version")) {
      headers.set("anthropic-version", env.ANTHROPIC_VERSION || DEFAULT_ANTHROPIC_VERSION);
    }
  } else if (route.provider === "azure") {
    headers.set("api-key", customerApiKey as string);
  } else if (route.provider !== "bedrock") {
    headers.set("authorization", `Bearer ${customerApiKey}`);
  }

  const body = (request.method === "GET" || request.method === "HEAD") ? undefined : (payloadText !== undefined && payloadText !== null ? payloadText : request.body);

  let finalRequest = new Request(route.upstreamUrl, {
    body,
    headers,
    method: request.method,
    redirect: "manual",
  });

  if (route.provider === "bedrock") {
    const regionMatch = new URL(route.upstreamUrl).hostname.match(/bedrock-runtime\.([a-z0-9-]+)\.amazonaws\.com/);
    const region = regionMatch ? regionMatch[1] : (env.AWS_REGION || "us-east-1");
    
    const aws = new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY || "",
      region,
      service: "bedrock"
    });
    
    // Sign the request
    finalRequest = await aws.sign(finalRequest);
  }

  return finalRequest;
}


async function capturePayload(request: { text(): Promise<string> }): Promise<CapturedPayload> {
  let rawText: string;

  try {
    rawText = await request.text();
  } catch (error) {
    return {
      json: null,
      rawText: "",
      parseError: error instanceof Error ? error.message : String(error),
    };
  }

  if (!rawText) {
    return { json: null, rawText };
  }

  try {
    return { json: JSON.parse(rawText) as unknown, rawText };
  } catch (error) {
    return {
      json: null,
      rawText,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function logCompletedExchange(params: {
  capturedPayload: Promise<CapturedPayload>;
  env: Env;
  requestStartedAt: Date;
  response: Response;
  route: RouteMatch;
  tenantId: string;
  teamId?: string | null;
  sessionId?: string | null;
  upstreamTtfbMs: number;
  startMs: number;
  proxyOverheadMs: number;
}): Promise<void> {
  const [payload, capturedResponse] = await Promise.all([
    params.capturedPayload,
    captureResponse(params.response, params.route.provider),
  ]);

  const model = extractModel(payload.json) || capturedResponse.model || null;
  const identifiedRisks = analyzePayload(payload.rawText);
  const promptTokens =
    capturedResponse.usage.promptTokens ?? estimatePromptTokens(payload, params.route.provider, model);
  const completionTokens =
    capturedResponse.usage.completionTokens ?? estimateTextTokens(capturedResponse.completionText, model);
  const totalLatencyMs = Date.now() - params.startMs;

  await writeSupabaseLog(params.env, {
    completion_tokens: completionTokens,
    error: payload.parseError || capturedResponse.error || null,
    is_stream: capturedResponse.isStream,
    model,
    prompt_tokens: promptTokens,
    provider: params.route.provider,
    request_started_at: params.requestStartedAt.toISOString(),
    response_status: params.response.status,
    tenant_id: params.tenantId,
    total_latency_ms: totalLatencyMs,
    proxy_overhead_ms: params.proxyOverheadMs,
    upstream_path: params.route.upstreamPath,
    upstream_request_id: getProviderRequestId(params.response),
    upstream_ttfb_ms: params.upstreamTtfbMs,
    identified_risks: identifiedRisks,
    project: null,
    team: params.teamId || null,
    session_id: params.sessionId || null,
    iteration_index: null,
    cumulative_tokens_in_session: null,
  });
}

async function logFailedExchange(params: {
  capturedPayload: Promise<CapturedPayload>;
  env: Env;
  error: string;
  requestStartedAt: Date;
  route: RouteMatch;
  tenantId: string;
  totalLatencyMs: number;
}): Promise<void> {
  const payload = await params.capturedPayload;
  const model = extractModel(payload.json);
  const identifiedRisks = analyzePayload(payload.rawText);

  await writeSupabaseLog(params.env, {
    completion_tokens: 0,
    error: params.error,
    is_stream: isStreamRequest(payload.json),
    model,
    prompt_tokens: estimatePromptTokens(payload, params.route.provider, model),
    provider: params.route.provider,
    request_started_at: params.requestStartedAt.toISOString(),
    response_status: null,
    tenant_id: params.tenantId,
    total_latency_ms: params.totalLatencyMs,
    proxy_overhead_ms: 0, // Failed exchange has no proxy overhead
    upstream_path: params.route.upstreamPath,
    upstream_request_id: null,
    upstream_ttfb_ms: null,
    identified_risks: identifiedRisks,
    project: null,
    team: null,
    session_id: null,
    iteration_index: null,
    cumulative_tokens_in_session: null,
  });
}

async function captureResponse(response: Response, provider: Provider): Promise<CapturedResponse> {
  const contentType = response.headers.get("content-type") || "";
  const isStream = contentType.includes("text/event-stream");

  if (!response.body) {
    return { completionText: "", usage: {}, isStream, json: null, error: null, model: null };
  }

  try {
    const bodyText = await response.text();
    return isStream
      ? captureStreamingResponse(bodyText, provider)
      : captureJsonResponse(bodyText, provider);
  } catch (error) {
    return {
      completionText: "",
      error: error instanceof Error ? error.message : String(error),
      isStream,
      usage: {},
      json: null,
      model: null,
    };
  }
}

function captureJsonResponse(bodyText: string, provider: Provider): CapturedResponse {
  const parsed = safeJsonParse(bodyText);
  if (!isRecord(parsed)) {
    return { completionText: bodyText, usage: {}, isStream: false, json: null, error: null, model: null };
  }

  return {
    completionText: provider === "openai" ? extractOpenAICompletionText(parsed) : extractAnthropicCompletionText(parsed),
    isStream: false,
    model: typeof parsed.model === "string" ? parsed.model : null,
    usage: normalizeProviderUsage(provider, parsed.usage),
    json: parsed,
    error: null,
  };
}

function captureStreamingResponse(bodyText: string, provider: Provider): CapturedResponse {
  let completionText = "";
  let model: string | undefined;
  const usage: Usage = {};

  for (const line of bodyText.split(/\r?\n/)) {
    if (!line.startsWith("data:")) {
      continue;
    }

    const data = line.slice("data:".length).trim();
    if (!data || data === "[DONE]") {
      continue;
    }

    const parsed = safeJsonParse(data);
    if (!isRecord(parsed)) {
      continue;
    }

    if (typeof parsed.model === "string") {
      model = parsed.model;
    }

    mergeUsage(usage, normalizeProviderUsage(provider, parsed.usage));
    completionText += provider === "openai" ? extractOpenAIStreamDelta(parsed) : extractAnthropicStreamDelta(parsed);
  }

  return { completionText, isStream: true, model: model ?? null, usage, json: null, error: null };
}

function normalizeProviderUsage(provider: Provider, usage: unknown): Usage {
  if (!isRecord(usage)) {
    return {};
  }

  if (provider === "openai") {
    return {
      completionTokens: numberOrUndefined(usage.completion_tokens),
      promptTokens: numberOrUndefined(usage.prompt_tokens),
    };
  }

  return {
    completionTokens: numberOrUndefined(usage.output_tokens),
    promptTokens: numberOrUndefined(usage.input_tokens),
  };
}

function mergeUsage(target: Usage, next: Usage): void {
  if (typeof next.promptTokens === "number") {
    target.promptTokens = next.promptTokens;
  }

  if (typeof next.completionTokens === "number") {
    target.completionTokens = next.completionTokens;
  }
}

function extractModel(payload: unknown): string | null {
  return isRecord(payload) && typeof payload.model === "string" ? payload.model : null;
}

function isStreamRequest(payload: unknown): boolean {
  return isRecord(payload) && payload.stream === true;
}

function estimatePromptTokens(payload: CapturedPayload, provider: Provider, model: string | null): number {
  if (isRecord(payload.json)) {
    if (Array.isArray(payload.json.messages)) {
      return estimateMessagesTokens(payload.json.messages, model);
    }

    if (provider === "openai" && typeof payload.json.input === "string") {
      return estimateTextTokens(payload.json.input, model);
    }

    if (provider === "anthropic") {
      return estimateAnthropicPayloadTokens(payload.json, model);
    }
  }

  return estimateTextTokens(payload.rawText, model);
}

function estimateMessagesTokens(messages: unknown[], model: string | null): number {
  const perMessageOverhead = 3;
  const replyPrimerOverhead = 3;
  let tokens = replyPrimerOverhead;

  for (const message of messages) {
    tokens += perMessageOverhead;

    if (!isRecord(message)) {
      tokens += estimateTextTokens(String(message), model);
      continue;
    }

    if (typeof message.role === "string") {
      tokens += estimateTextTokens(message.role, model);
    }

    if (typeof message.name === "string") {
      tokens += estimateTextTokens(message.name, model);
    }

    tokens += estimateUnknownContentTokens(message.content, model);
    tokens += estimateUnknownContentTokens(message.tool_calls, model);
    tokens += estimateUnknownContentTokens(message.function_call, model);
  }

  return tokens;
}

function estimateAnthropicPayloadTokens(payload: Record<string, unknown>, model: string | null): number {
  let tokens = 0;

  if (typeof payload.system === "string") {
    tokens += estimateTextTokens(payload.system, model);
  } else {
    tokens += estimateUnknownContentTokens(payload.system, model);
  }

  if (Array.isArray(payload.messages)) {
    tokens += estimateMessagesTokens(payload.messages, model);
  }

  return tokens;
}

function estimateUnknownContentTokens(value: unknown, model: string | null): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "string") {
    return estimateTextTokens(value, model);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return estimateTextTokens(String(value), model);
  }

  if (Array.isArray(value)) {
    return value.reduce<number>((sum, item) => sum + estimateUnknownContentTokens(item, model), 0);
  }

  if (isRecord(value)) {
    return Object.values(value).reduce<number>((sum, item) => sum + estimateUnknownContentTokens(item, model), 0);
  }

  return 0;
}

function estimateTextTokens(text: string, model: string | null): number {
  if (!text) {
    return 0;
  }

  return encoderFor(model).encode(text).length;
}

function encoderFor(model: string | null): Tiktoken {
  const key = encodingNameFor(model);
  const cached = encoderCache.get(key);
  if (cached) {
    return cached;
  }

  // Evict oldest if cache is full (should only be 2 entries max, but defensive)
  if (encoderCache.size >= MAX_ENCODER_CACHE) {
    const firstKey = encoderCache.keys().next().value;
    if (firstKey) encoderCache.delete(firstKey);
  }

  const encoder = new Tiktoken(key === "cl100k_base" ? cl100kBase : o200kBase);
  encoderCache.set(key, encoder);
  return encoder;
}

function encodingNameFor(model: string | null): "o200k_base" | "cl100k_base" {
  const normalized = (model || "").toLowerCase();

  if (
    normalized.includes("gpt-3.5") ||
    normalized.includes("gpt-4-") ||
    normalized.includes("gpt-5-") ||
    normalized.includes("gpt-4.") ||
    normalized.includes("gpt-5.") ||
    normalized.includes("text-embedding-3") ||
    normalized.includes("claude")
  ) {
    return "cl100k_base";
  }

  return "o200k_base";
}

function extractOpenAICompletionText(response: Record<string, unknown>): string {
  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  const choices = Array.isArray(response.choices) ? response.choices : [];
  let text = "";

  for (const choice of choices) {
    if (!isRecord(choice)) {
      continue;
    }

    if (typeof choice.text === "string") {
      text += choice.text;
    }

    if (isRecord(choice.message)) {
      text += extractContentText(choice.message.content);
    }
  }

  if (Array.isArray(response.output)) {
    for (const outputItem of response.output) {
      if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) {
        continue;
      }

      for (const contentItem of outputItem.content) {
        if (isRecord(contentItem) && typeof contentItem.text === "string") {
          text += contentItem.text;
        }
      }
    }
  }

  return text;
}

function extractAnthropicCompletionText(response: Record<string, unknown>): string {
  return extractContentText(response.content);
}

function extractOpenAIStreamDelta(event: Record<string, unknown>): string {
  const choices = Array.isArray(event.choices) ? event.choices : [];
  let text = "";

  for (const choice of choices) {
    if (!isRecord(choice) || !isRecord(choice.delta)) {
      continue;
    }

    text += extractContentText(choice.delta.content);
    text += typeof choice.delta.reasoning_content === "string" ? choice.delta.reasoning_content : "";
  }

  if (isRecord(event.response)) {
    text += extractOpenAICompletionText(event.response);
  }

  return text;
}

function extractAnthropicStreamDelta(event: Record<string, unknown>): string {
  if (event.type === "content_block_delta" && isRecord(event.delta)) {
    return typeof event.delta.text === "string" ? event.delta.text : "";
  }

  return "";
}

function extractContentText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  let text = "";
  for (const item of content) {
    if (!isRecord(item)) {
      continue;
    }

    if (typeof item.text === "string") {
      text += item.text;
    }

    if (typeof item.input === "string") {
      text += item.input;
    }
  }

  return text;
}

async function upsertTeamBudget(env: Env, tenantId: string, team: string, monthlyBudgetUsd: number, alertThresholdPct: number, hardStop: boolean): Promise<boolean> {
  const url = `${env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/team_budgets?on_conflict=tenant_id,team`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        team,
        monthly_budget_usd: monthlyBudgetUsd,
        alert_threshold_pct: alertThresholdPct,
        hard_stop: hardStop,
        updated_at: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    return response.ok;
  } catch (error) {
    console.error("AgentWatch upsertTeamBudget error", error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

// Rules engine: fetch tenant rules with KV cache (60s TTL)
const rulesCache = new Map<string, { rules: TenantRule[]; expiresAt: number }>();

async function getTenantRules(env: Env, tenantId: string): Promise<TenantRule[]> {
  const now = Date.now();
  const cached = rulesCache.get(tenantId);
  if (cached && now < cached.expiresAt) return cached.rules;

  // Evict stale entries if cache is too large
  if (rulesCache.size >= MAX_RULES_CACHE) {
    for (const [key, val] of rulesCache) {
      if (now >= val.expiresAt) rulesCache.delete(key);
    }
  }

  try {
    const result = await callRpc(env, "get_tenant_rules", tenantId);
    const rules = parseRulesFromJson(result);
    rulesCache.set(tenantId, { rules, expiresAt: now + 60_000 });
    return rules;
  } catch {
    // On Supabase outage, use stale cache if available instead of disabling all rules
    if (cached && cached.rules.length > 0) return cached.rules;
    return [];
  }
}

function applyRuleResult(result: RuleEvaluationResult): Response | null {
  if (!result.matched || !result.action) return null;

  switch (result.action) {
    case "block":
      return jsonError(403, JSON.stringify({
        error: {
          message: result.message || `Blocked by policy: ${result.rule_name}`,
          type: "agentwatch_policy_block",
          rule: result.rule_name,
          rule_id: result.rule_id,
        }
      }));

    case "throttle":
      // Throttle returns 429 with Retry-After. The delay_ms from action_config
      // determines the retry delay. This is enforced at the proxy level — the
      // request never reaches the upstream provider.
      return jsonError(429, JSON.stringify({
        error: {
          message: result.message || `Throttled by policy: ${result.rule_name}`,
          type: "agentwatch_policy_throttle",
          rule: result.rule_name,
          rule_id: result.rule_id,
          retry_after_ms: result.delay_ms || 1000,
        }
      }));

    case "alert":
      // Alert is fire-and-forget; the proxy continues but logs the event
      return null;

    case "tag":
      // Tag is metadata; the proxy continues but adds the tag to the log
      return null;

    case "allow":
      return null;

    default:
      return null;
  }
}

async function upsertTenantRule(
  env: Env, tenantId: string, name: string, enabled: boolean, priority: number,
  condition: unknown, action: string, actionConfig: unknown,
): Promise<boolean> {
  const url = `${env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/tenant_rules`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        prefer: "return=minimal",
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        name,
        enabled,
        priority,
        condition,
        action,
        action_config: actionConfig,
      }),
      signal: controller.signal,
    });
    return response.ok;
  } catch (error) {
    console.error("AgentWatch upsertTenantRule error", error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function deleteTenantRule(env: Env, tenantId: string, ruleId: number): Promise<boolean> {
  const url = `${env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/tenant_rules?id=eq.${ruleId}&tenant_id=eq.${tenantId}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      signal: controller.signal,
    });
    return response.ok;
  } catch (error) {
    console.error("AgentWatch deleteTenantRule error", error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function logAuthEvent(
  env: Env,
  tenantId: string,
  eventType: string,
  subject: string | null,
  request: Request,
  details: Record<string, unknown>,
): Promise<void> {
  if (!env.SUPABASE_URL) return;

  const url = `${env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/auth_events`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        prefer: "return=minimal",
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        event_type: eventType,
        subject,
        ip_address: request.headers.get("cf-connecting-ip") || null,
        user_agent: request.headers.get("user-agent") || null,
        details,
      }),
      signal: controller.signal,
    });
  } catch {
    // Auth event logging is best-effort
  } finally {
    clearTimeout(timeout);
  }
}

async function logApiAccess(
  env: Env,
  tenantId: string,
  eventType: string,
  endpoint: string,
  method: string,
  request: Request,
  responseStatus: number,
  details?: Record<string, unknown>,
): Promise<void> {
  if (!env.SUPABASE_URL) return;

  const url = `${env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/api_access_log`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        prefer: "return=minimal",
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        event_type: eventType,
        endpoint,
        method,
        response_status: responseStatus,
        ip_address: request.headers.get("cf-connecting-ip") || null,
        user_agent: request.headers.get("user-agent") || null,
        session_id: null,
        details: details || null,
      }),
      signal: controller.signal,
    });
  } catch {
    // API access logging is best-effort
  } finally {
    clearTimeout(timeout);
  }
}

async function upsertTenantResidency(
  env: Env, tenantId: string, region: string, enforced: boolean, fallbackAllowed: boolean,
): Promise<boolean> {
  const url = `${env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/tenant_residency`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        region,
        data_residency_enforced: enforced,
        eu_fallback_allowed: fallbackAllowed,
        updated_at: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    return response.ok;
  } catch (error) {
    console.error("AgentWatch upsertTenantResidency error", error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function callRpc(env: Env, functionName: string, tenantId: string, ...args: (string | number)[]): Promise<unknown> {
  const url = `${env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/rpc/${functionName}`;
  const params: Record<string, string> = { tenant_id_param: tenantId };
  if (args.length > 0) {
    if (typeof args[0] === "number") params.days_back = String(args[0]);
    if (typeof args[0] === "string") params.team_param = args[0];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`Supabase RPC ${functionName} failed:`, response.status);
      return null;
    }

    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error(`AgentWatch RPC ${functionName} error`, error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function callRpcWithParams(
  env: Env, functionName: string, params: Record<string, string | number>
): Promise<unknown> {
  const url = `${env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/rpc/${functionName}`;
  const body: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    body[k] = String(v);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`Supabase RPC ${functionName} failed:`, response.status);
      return null;
    }

    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error(`AgentWatch RPC ${functionName} error`, error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function writeSupabaseLog(env: Env, record: LogRecord): Promise<void> {
  // Deduct tokens asynchronously using RPC
  try {
    if (env.TENANT_BALANCE && record.tenant_id) {
      const doId = env.TENANT_BALANCE.idFromName(record.tenant_id);
      const doStub = env.TENANT_BALANCE.get(doId);
      const exactCostUsd = calculateCost(record.prompt_tokens || 0, record.completion_tokens || 0, record.model);
      if (exactCostUsd > 0 && record.response_status === 200) {
        // We only wait for the RPC call to dispatch, not necessarily finish processing, though await completes it
        await doStub.deductCost(exactCostUsd, record.tenant_id);
      }
    }
  } catch (err) {
    console.error("Failed to deduct tokens from balance DO", err);
  }

  if (env.TELEMETRY_QUEUE) {
    try {
      await env.TELEMETRY_QUEUE.send(record);
      return;
    } catch (error) {
      console.error("AgentWatch queue dispatch failed, falling back to direct insert", error);
    }
  }
  await writeSupabaseLogDirect(env, record);
}

async function writeSupabaseLogDirect(env: Env, record: LogRecord): Promise<void> {
  const configuredTimeoutMs = Number(env.LOG_WRITE_TIMEOUT_MS || DEFAULT_LOG_WRITE_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(configuredTimeoutMs) ? configuredTimeoutMs : DEFAULT_LOG_WRITE_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/llm_request_logs`, {
      body: JSON.stringify(record),
      headers: {
        "content-type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        prefer: "return=minimal",
      },
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("Supabase log insert failed:", response.status);
      throw new Error(`Supabase insert failed: ${response.status}`);
    }
  } catch (error) {
    console.error("AgentWatch Supabase log insert error", error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getProviderRequestId(response: Response): string | null {
  return response.headers.get("x-request-id") || response.headers.get("request-id");
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeSessionId(raw: string): string | null {
  // Strip control characters (newlines, tabs, null bytes, etc.) and truncate.
  // Only allow alphanumeric, hyphens, underscores, and dots — safe for KV keys and log storage.
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-.]/g, "").slice(0, 100);
  return cleaned.length > 0 ? cleaned : null;
}

function safeParseInt(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function jsonError(status: number, message: string): Response {
  return new Response(
    JSON.stringify({
      error: {
        message,
        type: "agentwatch_proxy_error",
      },
    }),
    {
      headers: { "content-type": "application/json", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" },
      status,
    },
  );
}

let rateLimitWarningLogged = false;

async function checkRateLimit(tenantId: string, team: string, env: Env): Promise<boolean> {
  if (!env.RATE_LIMITER) {
    if (!rateLimitWarningLogged) {
      console.warn("RATE_LIMITER not configured — allowing all requests");
      rateLimitWarningLogged = true;
    }
    return true;
  }
  const { success } = await env.RATE_LIMITER.limit({ key: `${tenantId}:${team}` });
  return success;
}

interface TeamBudgetStatus {
  team: string;
  monthly_budget_usd: number;
  current_spend: number;
  pct_used: number;
  hard_stop: boolean;
  status: string;
}

const budgetRpcInflight = new Map<string, Promise<string | "ERROR">>();

async function getTeamRemainingBudget(env: Env, tenantId: string, team: string | null): Promise<number | null | "ERROR"> {
  if (!team || !env.SUPABASE_URL) return null;
  const cacheKey = `t:${tenantId}:budget_status`;

  let budgetsJson = await env.KV.get(cacheKey);
  if (!budgetsJson) {
    // Deduplicate concurrent RPCs for the same tenant
    let inflight = budgetRpcInflight.get(cacheKey);
    if (!inflight) {
      inflight = (async () => {
        try {
          const result = await callRpc(env, "check_team_budgets", tenantId);
          const json = JSON.stringify(result || []);
          await env.KV.put(cacheKey, json, { expirationTtl: 60 });
          return json;
        } catch {
          return "ERROR";
        } finally {
          budgetRpcInflight.delete(cacheKey);
        }
      })();
      budgetRpcInflight.set(cacheKey, inflight);
    }
    budgetsJson = await inflight;
  }

  if (budgetsJson === "ERROR") return "ERROR";
  if (!budgetsJson) return null;

  try {
    const budgets = JSON.parse(budgetsJson) as TeamBudgetStatus[];
    const tBudget = budgets.find(b => b.team === team);
    if (tBudget && tBudget.hard_stop) {
      return Math.max(0, tBudget.monthly_budget_usd - tBudget.current_spend);
    }
  } catch {}
  return null;
}



// Streaming budget enforcement: wraps a response body to monitor token usage
// and terminate the stream if the session budget is exceeded mid-response.
//
// Token estimation approach:
// - If the provider returns `usage` in the final SSE chunk (OpenAI does, Anthropic does not always),
//   we use actual counts.
// - Otherwise, we estimate ~4 chars per token as a fallback. This is conservative — actual tokenizers
//   typically yield 3-4 chars/token for English. The estimate may slightly undercount for non-English
//   or code, but it's sufficient for budget enforcement where we err on the side of allowing more.
// - KV is updated periodically (every 20 chunks) to avoid excessive function wrapStreamWithBudget(
function wrapStreamWithBudget(
  response: Response,
  sessionId: string,
  budgetUsd: number,
  startCumulativeTokens: number,
  tenantId: string,
  provider: Provider,
  model: string | null,
  env: Env,
  ctx: ExecutionContext,
  fallbackPolicy: "fail_open" | "fail_closed"
): ReadableStream {
  let localTokensToFlush = 0;
  let cumulativeTokens = startCumulativeTokens;
  let chunkCount = 0;
  let closed = false;

  const reader = response.body?.getReader();
  if (!reader) return response.body || new ReadableStream();

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  
  const doId = env.SESSION_TRACKER.idFromName(`t:${tenantId}:s:${sessionId}`);
  const doStub = env.SESSION_TRACKER.get(doId);

  return new ReadableStream({
    async pull(controller) {
      if (closed) {
        controller.close();
        return;
      }

      const { done, value } = await reader.read();
      if (done) {
        if (localTokensToFlush > 0) {
          ctx.waitUntil(doStub.incrementTokens(localTokensToFlush));
        }
        controller.close();
        return;
      }

      chunkCount++;
      const chunkText = decoder.decode(value, { stream: true });

      for (const line of chunkText.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const usage = parsed.usage;
          if (usage) {
            const promptTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0;
            const completionTokens = usage.completion_tokens ?? usage.output_tokens ?? 0;
            const newTokens = promptTokens + completionTokens;
            if (newTokens > 0) {
              localTokensToFlush += newTokens;
            }
          }
        } catch {
          // Not JSON or no usage — continue
        }
      }

      if (chunkCount % 10 === 0 && localTokensToFlush === 0) {
        const textContent = chunkText.replace(/^data:.*$/gm, "").trim();
        if (textContent.length > 0) {
          localTokensToFlush += Math.ceil(textContent.length / 4);
        }
      }

      if (localTokensToFlush > 0) {
        const added = localTokensToFlush;
        localTokensToFlush = 0;
        
        const addedUsd = calculateCost(0, added, model);
        
        try {
          const res = await doStub.incrementTokensAndUsd(added, addedUsd);
          const spentUsd = res.usd;
          cumulativeTokens = res.tokens;

          if (spentUsd >= budgetUsd) {
            closed = true;
            const cutoffEvent = `data: ${JSON.stringify({
              error: {
                message: `Stream terminated: session budget exceeded ($${spentUsd.toFixed(4)} / $${budgetUsd.toFixed(4)})`,
                type: "agentwatch_budget_cutoff",
                session_id: sessionId,
                spent_usd: spentUsd,
                limit_usd: budgetUsd,
                cumulative_tokens: cumulativeTokens,
              }
            })}\n\n`;
            controller.enqueue(encoder.encode(cutoffEvent));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();

            ctx.waitUntil(
              (async () => {
                await writeSupabaseLog(env, {
                  tenant_id: tenantId,
                  provider: provider,
                  upstream_path: "/v1/stream-budget-cutoff",
                  model: null,
                  request_started_at: new Date().toISOString(),
                  response_status: 402,
                  is_stream: true,
                  prompt_tokens: 0,
                  completion_tokens: cumulativeTokens,
                  upstream_ttfb_ms: 0,
                  total_latency_ms: 0,
                  proxy_overhead_ms: 0, // Stream cutoff has no proxy overhead
                  upstream_request_id: null,
                  identified_risks: [],
                  project: null,
                  team: null,
                  session_id: sessionId,
                  iteration_index: null,
                  cumulative_tokens_in_session: cumulativeTokens,
                  error: `budget_cutoff:$${spentUsd.toFixed(4)}/$${budgetUsd.toFixed(4)}`
                });
              })()
            );
            return;
          }
        } catch {
          if (fallbackPolicy === "fail_closed") {
            closed = true;
            const cutoffEvent = `data: ${JSON.stringify({
              error: {
                message: `Stream terminated: Session check failed due to system timeout (Policy: fail_closed)`,
                type: "agentwatch_budget_cutoff",
                session_id: sessionId
              }
            })}\n\n`;
            controller.enqueue(encoder.encode(cutoffEvent));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }
        }
      }

      controller.enqueue(value);

      if (chunkCount % 20 === 0) {
        const sessionKey = `t:${tenantId}:s:${sessionId}:tokens`;
        ctx.waitUntil(env.KV.put(sessionKey, cumulativeTokens.toString(), { expirationTtl: 86400 }));
      }
    },

    cancel() {
      closed = true;
      reader.cancel();
    }
  });
}

function logRequest(env: Env, method: string, pathname: string, status: number, startTime: number) {
  const latency = Date.now() - startTime;
  const log = { method, pathname, status, latency, timestamp: new Date().toISOString() };
  console.log(JSON.stringify(log));
}

function supabaseHeaders(env: Env): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "apikey": env.SUPABASE_SERVICE_ROLE_KEY!,
    "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
  };
}

function corsHeaders(env: Env): Record<string, string> {
  let origin = env.CORS_ALLOWED_ORIGIN || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret",
    "Access-Control-Max-Age": "86400",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        origin = "";
      }
    } catch {
      origin = "";
    }
  }
  headers["Access-Control-Allow-Origin"] = origin || "*";
  return headers;
}

function securityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; img-src 'self' data: https:; connect-src 'self'; frame-src 'self'",
  };
}

async function provisionTenant(env: Env, customerEmail: string, customerId?: string | null, subscriptionId?: string | null) {
  const newTenantId = `tenant_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const newTenantToken = `aw_live_${crypto.randomUUID().replace(/-/g, "")}`;

  await env.KV.put(
    `tenant:token:${newTenantToken}`,
    JSON.stringify({
      tenantId: newTenantId,
      email: customerEmail,
      customerId: customerId || null,
      subscriptionId: subscriptionId || null,
      createdAt: new Date().toISOString(),
    }),
  );

  await env.KV.put(`tenant:plan:${newTenantId}`, JSON.stringify({
    plan: "free",
    createdAt: new Date().toISOString(),
  }));
  if (subscriptionId) {
    await env.KV.put(`tenant:sub:${subscriptionId}`, newTenantId);
  }

  if (env.RESEND_API_KEY) {
    const emailHtml = getProvisionEmailHtml(newTenantToken, env.SITE_URL || "http://localhost:8787");

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.REPORT_FROM_EMAIL || `AgentWatch Onboarding <hello@${env.SITE_URL || "localhost:8787"}>`,
        to: [customerEmail],
        subject: "Welcome to AgentWatch - Your API Key Inside",
        html: emailHtml
      })
    }).catch(() => {});
  }
  
  return { tenantId: newTenantId, token: newTenantToken };
}
