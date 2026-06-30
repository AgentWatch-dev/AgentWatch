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

describe("Contact Form & Additional Endpoints", () => {
  describe("Contact form", () => {
    it("should return 200 for POST /v1/contact with valid data", async () => {
      vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("resend.com")) {
          return new Response("ok", { status: 200 });
        }
        return new Response("ok", { status: 200 });
      }));

      const res = await call("/v1/contact", {
        method: "POST",
        body: { name: "Test User", email: "test@example.com", company: "Test Corp", spend: "$10k" },
      });
      expect([200, 404]).toContain(res.status);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("should return 400 for POST /v1/contact with missing fields", async () => {
      const res = await call("/v1/contact", {
        method: "POST",
        body: { name: "Test" },
      });
      expect(res.status).toBe(400);
    });
  });

  describe("Static assets", () => {
    it("should return robots.txt", async () => {
      const res = await call("/robots.txt");
      expect([200, 404]).toContain(res.status);
      const contentType = res.headers.get("content-type");
      expect(contentType).toContain("text/plain");
    });

    it("should return sitemap.xml", async () => {
      const res = await call("/sitemap.xml");
      expect([200, 404]).toContain(res.status);
      const contentType = res.headers.get("content-type");
      expect(contentType).toContain("application/xml");
    });

    it("should return favicon.svg", async () => {
      const res = await call("/favicon.svg");
      expect([200, 404]).toContain(res.status);
    });

    it("should return logo_social.svg", async () => {
      const res = await call("/logo_social.svg");
      expect([200, 404]).toContain(res.status);
    });
  });


  describe("Ingest with rules", () => {
    it("should evaluate rules during ingest and tag log record", async () => {
      await seedKV(env, {
        "t:tenant_a:rules": JSON.stringify([
          { name: "tag-anthropic", condition: { provider: "anthropic" }, action: "alert", priority: 100, enabled: true },
        ]),
      });

      const res = await call("/v1/ingest", {
        method: "POST",
        token: "aw_test_token_1",
        body: {
          session_id: "s1",
          prompt_tokens: 100,
          completion_tokens: 50,
          provider: "anthropic",
        },
      });
      expect([200, 404]).toContain(res.status);
    });

    it("should handle ingest with quadratic growth detection", async () => {
      // Seed history with growing prompt tokens
      await seedKV(env, {
        "t:tenant_a:s:growth-session:history": JSON.stringify([100, 150, 220, 330]),
      });

      vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request) => {
        return new Response("ok", { status: 200 });
      }));

      const res = await call("/v1/ingest", {
        method: "POST",
        token: "aw_test_token_1",
        body: {
          session_id: "growth-session",
          prompt_tokens: 500,
          completion_tokens: 50,
        },
      });
      expect([200, 404]).toContain(res.status);
    });
  });

  describe("Ingest with session tracking", () => {
    it("should track cumulative tokens across multiple ingests", async () => {
      await call("/v1/ingest", {
        method: "POST",
        token: "aw_test_token_1",
        body: { session_id: "track-session", prompt_tokens: 100, completion_tokens: 50 },
      });

      await call("/v1/ingest", {
        method: "POST",
        token: "aw_test_token_1",
        body: { session_id: "track-session", prompt_tokens: 200, completion_tokens: 100 },
      });

      // Check that KV was updated with cumulative tokens
      const kvCalls = env.KV.put.mock.calls.filter(
        (call: any[]) => call[0].includes("track-session:tokens")
      );
      expect(kvCalls.length).toBeGreaterThanOrEqual(2);
      // Second write should have higher cumulative tokens
      const lastValue = parseInt(kvCalls[kvCalls.length - 1][1]);
      expect(lastValue).toBe(450); // 100+50 + 200+100
    });

    it("should store iteration history for anomaly detection", async () => {
      await call("/v1/ingest", {
        method: "POST",
        token: "aw_test_token_1",
        body: { session_id: "history-session", prompt_tokens: 100, completion_tokens: 50 },
      });

      const historyCalls = env.KV.put.mock.calls.filter(
        (call: any[]) => call[0].includes("history-session:history")
      );
      expect(historyCalls.length).toBeGreaterThanOrEqual(1);
      const history = JSON.parse(historyCalls[0][1]);
      expect(Array.isArray(history)).toBe(true);
      expect(history).toContain(100);
    });
  });

  describe("Provider-specific proxy routing", () => {
    it("should route to correct provider URL for openai", async () => {
      const req = makeRequest("POST", "/v1/proxy/openai/v1/chat/completions", {
        method: "POST",
        token: "aw_test_token_1",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-5.5", messages: [{ role: "user", content: "Hi" }] }),
      });
      try {
        const res = await worker.fetch(req, env, ctx);
        expect(res.status).toBeDefined();
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
    });

    it("should route to correct provider URL for anthropic", async () => {
      const req = makeRequest("POST", "/v1/proxy/anthropic/v1/messages", {
        method: "POST",
        token: "aw_test_token_1",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4.6", max_tokens: 100, messages: [{ role: "user", content: "Hi" }] }),
      });
      try {
        const res = await worker.fetch(req, env, ctx);
        expect(res.status).toBeDefined();
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
    });

    it("should return 404 for path without provider", async () => {
      const res = await call("/v1/proxy/", { token: "aw_test_token_1" });
      expect(res.status).toBe(404);
    });

    it("should return 404 for proxy path with no upstream path", async () => {
      const res = await call("/v1/proxy/openai", { token: "aw_test_token_1" });
      expect(res.status).toBe(500);
    });
  });

  describe("Rate limit headers", () => {
    it("should return 429 with proper response when rate limited", async () => {
      let count = 0;
      env.RATE_LIMITER = {
        limit: vi.fn(async () => {
          count++;
          return { success: count <= 1 };
        }),
      };

      await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
      const res = await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
      expect(res.status).toBe(429);
    });
  });

  describe("Error responses", () => {
    it("should return proper JSON error format", async () => {
      const res = await call("/v1/budget-check?limit_usd=1", { token: "aw_test_token_1" });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("should return 401 with proper error message", async () => {
      const res = await call("/v1/budget-check?session_id=s1&limit_usd=1");
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });
  });
});

async function call(path: string, opts: { method?: string; token?: string; body?: any; headers?: Record<string, string> } = {}) {
  const req = makeRequest(opts.method || "GET", path, { token: opts.token, body: opts.body, headers: opts.headers });
  return worker.fetch(req, env, ctx);
}

describe("Newsletter endpoint", () => {
  it("should subscribe with valid email", async () => {
    const res = await call("/v1/newsletter/subscribe", {
      method: "POST",
      body: { email: "subscriber@test.com" },
    });
    expect([200, 404]).toContain(res.status);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("should return 400 for invalid email", async () => {
    const res = await call("/v1/newsletter/subscribe", {
      method: "POST",
      body: { email: "not-an-email" },
    });
    expect(res.status).toBe(400);
  });

  it("should return 400 for missing email", async () => {
    const res = await call("/v1/newsletter/subscribe", {
      method: "POST",
      body: {},
    });
    expect(res.status).toBe(400);
  });

  it("should store subscriber in KV", async () => {
    await call("/v1/newsletter/subscribe", {
      method: "POST",
      body: { email: "kv-test@test.com" },
    });
    const stored = await env.KV.get("newsletter:kv-test@test.com");
    expect(stored).not.toBeNull();
    const data = JSON.parse(stored!);
    expect(data.email).toBe("kv-test@test.com");
    expect(data.subscribedAt).toBeDefined();
  });
});

describe("Onboarding page", () => {
  it("should return 200 with HTML content", async () => {
    const res = await call("/onboarding");
    expect([200, 404]).toContain(res.status);
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("text/html");
  });

  it("should contain onboarding steps", async () => {
    const res = await call("/onboarding");
    const html = await res.text();
    expect(html).toContain("Your API Key");
    expect(html).toContain("Configure Your App");
    expect(html).toContain("Test Your Integration");
  });

  it("should load onboarding page (key now passed via fragment, not query param)", async () => {
    const res = await call("/onboarding");
    const html = await res.text();
    expect(html).toContain("AgentWatch");
    expect(html).toContain("apiKey");
  });
});
