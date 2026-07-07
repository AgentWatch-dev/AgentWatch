import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeEnv, makeRequest, makeCtx } from "./helpers";

let worker: any;
let env: any;
let ctx: any;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("../src/index");
  worker = mod.default;
  env = makeEnv();
  ctx = makeCtx();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function call(path: string, opts: { method?: string; token?: string; body?: any; headers?: Record<string, string> } = {}) {
  const req = makeRequest(opts.method || "GET", path, { token: opts.token, body: opts.body, headers: opts.headers });
  return worker.fetch(req, env, ctx);
}

describe("POST /v1/cost/estimate", () => {
  it("should return 200 with valid steps array", async () => {
    const res = await call("/v1/cost/estimate", {
      method: "POST",
      token: "aw_test_token_1",
      body: {
        steps: [
          { model: "gpt-4o", prompt_tokens: 1000, completion_tokens: 500 },
          { model: "claude-sonnet-4-6", prompt_tokens: 2000, completion_tokens: 1000 },
        ],
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total_estimated_cost_usd).toBeGreaterThan(0);
    expect(body.step_count).toBe(2);
    expect(body.steps).toHaveLength(2);
    expect(body.steps[0].model).toBe("gpt-4o");
    expect(body.steps[1].model).toBe("claude-sonnet-4-6");
  });

  it("should return 400 when steps array is empty", async () => {
    const res = await call("/v1/cost/estimate", {
      method: "POST",
      token: "aw_test_token_1",
      body: { steps: [] },
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain("steps");
  });

  it("should return 401 when token is missing", async () => {
    const res = await call("/v1/cost/estimate", {
      method: "POST",
      body: { steps: [{ model: "gpt-4o" }] },
    });
    expect(res.status).toBe(401);
  });

  it("should handle unknown model gracefully", async () => {
    const res = await call("/v1/cost/estimate", {
      method: "POST",
      token: "aw_test_token_1",
      body: { steps: [{ model: "nonexistent-model-xyz" }] },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.step_count).toBe(1);
  });

  it("should use default tokens when not provided in step", async () => {
    const res = await call("/v1/cost/estimate", {
      method: "POST",
      token: "aw_test_token_1",
      body: { steps: [{ model: "gpt-4o" }] },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.steps[0].prompt_tokens).toBe(1000);
    expect(body.steps[0].completion_tokens).toBe(500);
  });

  it("should return 400 for invalid JSON body", async () => {
    const req = makeRequest("POST", "/v1/cost/estimate", {
      token: "aw_test_token_1",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(400);
  });
});

describe("GET /v1/dashboard/timeline", () => {
  it("should return 200 with session_id parameter", async () => {
    const res = await call("/v1/dashboard/timeline?session_id=s1", {
      token: "aw_test_token_1",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("events");
    expect(Array.isArray(body.events)).toBe(true);
  });

  it("should return 400 when session_id is missing", async () => {
    const res = await call("/v1/dashboard/timeline", {
      token: "aw_test_token_1",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain("session_id");
  });

  it("should return 401 when token is missing", async () => {
    const res = await call("/v1/dashboard/timeline?session_id=s1");
    expect(res.status).toBe(401);
  });

  it("should return empty timeline for non-existent session", async () => {
    const res = await call("/v1/dashboard/timeline?session_id=nonexistent", {
      token: "aw_test_token_1",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events).toEqual([]);
  });
});

describe("GET /v1/sso/saml/init", () => {
  it("should return 501 when SSO is disabled", async () => {
    const noSsoEnv = makeEnv({ SSO_ENABLED: "false" });
    const req = makeRequest("GET", "/v1/sso/saml/init?tenant_id=tenant_a", {});
    const res = await worker.fetch(req, noSsoEnv, ctx);
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.error.message).toContain("SSO");
  });

  it("should return 302 redirect when SSO is enabled and tenant has Enterprise plan", async () => {
    const ssoEnv = makeEnv({ SSO_ENABLED: "true", SUPABASE_URL: "https://test.supabase.co" });
    await ssoEnv.KV.put("tenant:plan:tenant_a", JSON.stringify({ plan: "enterprise" }));

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlStr.includes("supabase.co")) {
        return new Response(JSON.stringify({
          idp_sso_url: "https://idp.example.com/sso",
          idp_entity_id: "https://idp.example.com",
          sp_entity_id: "aw-test",
          sp_acs_url: "https://agent-watch.dev/v1/sso/saml/acs"
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("ok", { status: 200 });
    });

    const req = makeRequest("GET", "/v1/sso/saml/init?tenant_id=tenant_a", {});
    const res = await worker.fetch(req, ssoEnv, ctx);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("https://idp.example.com/sso");
  });

  it("should return 400 when tenant_id is missing", async () => {
    const ssoEnv = makeEnv({ SSO_ENABLED: "true" });
    const req = makeRequest("GET", "/v1/sso/saml/init", {});
    const res = await worker.fetch(req, ssoEnv, ctx);
    expect(res.status).toBe(400);
  });

  it("should return 403 when tenant is not Enterprise", async () => {
    const ssoEnv = makeEnv({ SSO_ENABLED: "true" });
    await ssoEnv.KV.put("tenant:plan:tenant_a", JSON.stringify({ plan: "pro" }));
    const req = makeRequest("GET", "/v1/sso/saml/init?tenant_id=tenant_a", {});
    const res = await worker.fetch(req, ssoEnv, ctx);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.message).toContain("Enterprise");
  });
});

describe("POST /v1/sso/saml/acs", () => {
  it("should return 501 when SSO is disabled", async () => {
    const noSsoEnv = makeEnv({ SSO_ENABLED: "false" });
    const formData = new FormData();
    formData.append("SAMLResponse", btoa("<saml:Assertion/>"));
    formData.append("RelayState", "tenant_a");
    const req = new Request("https://agent-watch.dev/v1/sso/saml/acs", {
      method: "POST",
      body: formData
    });
    const res = await worker.fetch(req, noSsoEnv, ctx);
    expect(res.status).toBe(501);
  });

  it("should return 400 when SAMLResponse is missing", async () => {
    const ssoEnv = makeEnv({ SSO_ENABLED: "true" });
    const formData = new FormData();
    formData.append("RelayState", "tenant_a");
    const req = new Request("https://agent-watch.dev/v1/sso/saml/acs", {
      method: "POST",
      body: formData
    });
    const res = await worker.fetch(req, ssoEnv, ctx);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain("SAMLResponse");
  });

  it("should return 400 when RelayState is missing", async () => {
    const ssoEnv = makeEnv({ SSO_ENABLED: "true" });
    const formData = new FormData();
    formData.append("SAMLResponse", btoa("<saml:Assertion/>"));
    const req = new Request("https://agent-watch.dev/v1/sso/saml/acs", {
      method: "POST",
      body: formData
    });
    const res = await worker.fetch(req, ssoEnv, ctx);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain("RelayState");
  });

  it("should return 200 with valid SAML response (signature verified)", async () => {
    const ssoEnv = makeEnv({ SSO_ENABLED: "true", SUPABASE_URL: "https://test.supabase.co" });
    const { SignedXml } = await import("xml-crypto");
    vi.spyOn(SignedXml.prototype, "loadSignature").mockImplementation(() => {});
    vi.spyOn(SignedXml.prototype, "checkSignature").mockReturnValue(true);
    vi.spyOn(SignedXml.prototype, "getSignedXml").mockReturnValue(
      `<saml:Assertion InResponseTo="_test-req-id"><saml:Subject><saml:NameID>tenant_a</saml:NameID></saml:Subject></saml:Assertion>`
    );

    await ssoEnv.KV.put("saml_request:_test-req-id", "tenant_a", { expirationTtl: 300 });

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlStr.includes("supabase.co") && urlStr.includes("get_tenant_saml_config")) {
        return new Response(JSON.stringify({
          tenant_id: "tenant_a",
          idp_certificate: "MIIC...",
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("not mocked", { status: 501 });
    });

    const xml = `<saml:Assertion InResponseTo="_test-req-id"><saml:Subject><saml:NameID>tenant_a</saml:NameID></saml:Subject></saml:Assertion>`;
    const formData = new FormData();
    formData.append("SAMLResponse", btoa(xml));
    formData.append("RelayState", "tenant_a");
    const req = new Request("https://agent-watch.dev/v1/sso/saml/acs", {
      method: "POST",
      body: formData
    });
    const res = await worker.fetch(req, ssoEnv, ctx);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("SSO Login Successful");
  });

  it("should return 400 when tenant SAML is not configured", async () => {
    const ssoEnv = makeEnv({ SSO_ENABLED: "true" });
    const formData = new FormData();
    formData.append("SAMLResponse", btoa("<saml:Assertion/>"));
    formData.append("RelayState", "tenant_a");
    const req = new Request("https://agent-watch.dev/v1/sso/saml/acs", {
      method: "POST",
      body: formData
    });
    const res = await worker.fetch(req, ssoEnv, ctx);
    expect(res.status).toBe(400);
  });
});
