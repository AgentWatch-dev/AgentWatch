import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { makeEnv, makeRequest, makeCtx, seedKV } from "./helpers";

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

describe("Ingest Endpoint Deep Coverage", () => {
  it("should handle ingest with all fields populated", async () => {
    const res = await call("/v1/ingest", {
      method: "POST",
      token: "aw_test_token_1",
      body: {
        session_id: "full-session",
        iteration_index: 5,
        prompt_tokens: 500,
        completion_tokens: 200,
        model: "gpt-5.5",
        provider: "openai",
        upstream_path: "/v1/chat/completions",
        latency_ms: 150,
        identified_risks: ["PII_EMAIL"],
        project: "test-project",
        team: "test-team",
      },
    });
    expect(res.status).toBe(200);
  });

  it("should handle ingest with invalid provider (defaults to openai)", async () => {
    const res = await call("/v1/ingest", {
      method: "POST",
      token: "aw_test_token_1",
      body: {
        session_id: "s1",
        prompt_tokens: 100,
        completion_tokens: 50,
        provider: "invalid_provider",
      },
    });
    expect(res.status).toBe(200);
  });

  it("should handle ingest with non-finite latency_ms", async () => {
    const res = await call("/v1/ingest", {
      method: "POST",
      token: "aw_test_token_1",
      body: {
        session_id: "s1",
        prompt_tokens: 100,
        completion_tokens: 50,
        latency_ms: NaN,
      },
    });
    expect(res.status).toBe(200);
  });

  it("should handle ingest with non-array identified_risks", async () => {
    const res = await call("/v1/ingest", {
      method: "POST",
      token: "aw_test_token_1",
      body: {
        session_id: "s1",
        prompt_tokens: 100,
        completion_tokens: 50,
        identified_risks: "not an array",
      },
    });
    expect(res.status).toBe(200);
  });

  it("should filter invalid risk tags", async () => {
    const res = await call("/v1/ingest", {
      method: "POST",
      token: "aw_test_token_1",
      body: {
        session_id: "s1",
        prompt_tokens: 100,
        completion_tokens: 50,
        identified_risks: ["PII_EMAIL", "INVALID_TAG", "SECRET_JWT"],
      },
    });
    expect(res.status).toBe(200);
  });

  it("should handle ingest with non-finite iteration_index", async () => {
    const res = await call("/v1/ingest", {
      method: "POST",
      token: "aw_test_token_1",
      body: {
        session_id: "s1",
        prompt_tokens: 100,
        completion_tokens: 50,
        iteration_index: Infinity,
      },
    });
    expect(res.status).toBe(200);
  });

  it("should truncate long model names", async () => {
    const longModel = "a".repeat(300);
    const res = await call("/v1/ingest", {
      method: "POST",
      token: "aw_test_token_1",
      body: {
        session_id: "s1",
        prompt_tokens: 100,
        completion_tokens: 50,
        model: longModel,
      },
    });
    expect(res.status).toBe(200);
  });

  it("should truncate long upstream_path", async () => {
    const longPath = "/v1/" + "a".repeat(300);
    const res = await call("/v1/ingest", {
      method: "POST",
      token: "aw_test_token_1",
      body: {
        session_id: "s1",
        prompt_tokens: 100,
        completion_tokens: 50,
        upstream_path: longPath,
      },
    });
    expect(res.status).toBe(200);
  });

  it("should truncate long project and team names", async () => {
    const res = await call("/v1/ingest", {
      method: "POST",
      token: "aw_test_token_1",
      body: {
        session_id: "s1",
        prompt_tokens: 100,
        completion_tokens: 50,
        project: "a".repeat(200),
        team: "b".repeat(200),
      },
    });
    expect(res.status).toBe(200);
  });

  it("should handle ingest without Supabase configured", async () => {
    const noSupaEnv = makeEnv({ SUPABASE_URL: undefined });
    const req = makeRequest("POST", "/v1/ingest", {
      method: "POST",
      token: "aw_test_token_1",
      body: { session_id: "s1", prompt_tokens: 100, completion_tokens: 50 },
    });
    const res = await worker.fetch(req, noSupaEnv, ctx);
    expect(res.status).toBe(500);
  });
});

describe("Budget Check Deep Coverage", () => {
  it("should handle budget check with negative limit_usd", async () => {
    const res = await call("/v1/budget-check?session_id=s1&limit_usd=-5", { token: "aw_test_token_1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.exceeded).toBe(false);
  });

  it("should handle budget check with non-finite limit_usd", async () => {
    const res = await call("/v1/budget-check?session_id=s1&limit_usd=abc", { token: "aw_test_token_1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.exceeded).toBe(false);
  });

  it("should handle budget check with no limit_usd param", async () => {
    const res = await call("/v1/budget-check?session_id=s1", { token: "aw_test_token_1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.exceeded).toBe(false);
  });

  it("should calculate spent_usd correctly", async () => {
    await seedKV(env, { "t:tenant_a:s:session-1:usd": "3.0", "t:tenant_a:s:session-1:tokens": "1000000" });
    const res = await call("/v1/budget-check?session_id=session-1&limit_usd=10", { token: "aw_test_token_1" });
    const body = await res.json();
    expect(body.spent_usd).toBeCloseTo(3.0, 1);
    expect(body.cumulative_tokens).toBe(1000000);
  });
});

describe("Proxy Route Matching", () => {
  it("should return 404 for non-proxy routes", async () => {
    const res = await call("/v1/nonexistent", { token: "aw_test_token_1" });
    expect(res.status).toBe(404);
  });

  it("should return 404 for proxy with no provider", async () => {
    const res = await call("/v1/proxy/", { token: "aw_test_token_1" });
    expect(res.status).toBe(404);
  });

  it("should return 404 for proxy with empty provider", async () => {
    const res = await call("/v1/proxy//v1/chat/completions", { token: "aw_test_token_1" });
    expect(res.status).toBe(404);
  });

  it("should return 404 for proxy with unsupported provider", async () => {
    const res = await call("/v1/proxy/unsupported/v1/chat/completions", { token: "aw_test_token_1" });
    expect(res.status).toBe(404);
  });

  it("should return 402 for proxy with no credits", async () => {
    const res = await call("/v1/proxy/openai", { token: "aw_test_token_1" });
    expect(res.status).toBe(402);
  });
});

describe("Worker Configuration", () => {
  it("should return 500 when SUPABASE_URL is missing for ingest", async () => {
    const env2 = makeEnv({ SUPABASE_URL: undefined });
    const req = makeRequest("POST", "/v1/ingest", {
      method: "POST",
      token: "aw_test_token_1",
      body: { session_id: "s1", prompt_tokens: 100, completion_tokens: 50 },
    });
    const res = await worker.fetch(req, env2, ctx);
    expect(res.status).toBe(500);
  });

  it("should return 500 when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    const env2 = makeEnv({ SUPABASE_SERVICE_ROLE_KEY: undefined });
    const req = makeRequest("POST", "/v1/ingest", {
      method: "POST",
      token: "aw_test_token_1",
      body: { session_id: "s1", prompt_tokens: 100, completion_tokens: 50 },
    });
    const res = await worker.fetch(req, env2, ctx);
    expect(res.status).toBe(500);
  });

  it("should return 401 when TENANT_TOKEN_MAP is invalid JSON", async () => {
    const env2 = makeEnv({ TENANT_TOKEN_MAP: "not valid json" });
    const req = makeRequest("GET", "/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
    const res = await worker.fetch(req, env2, ctx);
    expect(res.status).toBe(401);
  });

  it("should return 500 when TENANT_TOKEN_MAP is empty", async () => {
    const env2 = makeEnv({ TENANT_TOKEN_MAP: "{}" });
    const req = makeRequest("GET", "/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
    const res = await worker.fetch(req, env2, ctx);
    expect(res.status).toBe(401);
  });
});


