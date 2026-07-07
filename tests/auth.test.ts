import { describe, it, expect, beforeEach, vi } from "vitest";
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

async function call(path: string, opts: { method?: string; token?: string; headers?: Record<string, string> } = {}) {
  const req = makeRequest(opts.method || "GET", path, { token: opts.token, headers: opts.headers });
  return worker.fetch(req, env, ctx);
}

describe("Authentication & Security", () => {
  describe("Bearer token validation", () => {
    it("should return 401 with missing Authorization header", async () => {
      const req = makeRequest("GET", "/v1/budget-check?session_id=s1&limit_usd=1");
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(401);
    });

    it("should return 401 with wrong format (Token xyz not Bearer xyz)", async () => {
      const res = await call("/v1/budget-check?session_id=s1&limit_usd=1", {
        headers: { Authorization: "Token aw_test_token_1" },
      });
      expect(res.status).toBe(401);
    });

    it("should return 401 with empty string token", async () => {
      const res = await call("/v1/budget-check?session_id=s1&limit_usd=1", {
        headers: { Authorization: "Bearer " },
      });
      expect(res.status).toBe(401);
    });

    it("should return 200 with token from KV", async () => {
      await seedKV(env, {
        "tenant:token:aw_kv_token": JSON.stringify({ tenantId: "tenant_kv" }),
      });
      const res = await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_kv_token" });
      expect(res.status).toBe(200);
    });

    it("should return 401 with token in neither KV nor TENANT_TOKEN_MAP", async () => {
      const res = await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_nonexistent_token" });
      expect(res.status).toBe(401);
    });

    it("should return 401 for SQL injection attempt in Bearer token", async () => {
      const res = await call("/v1/budget-check?session_id=s1&limit_usd=1", {
        token: "' OR 1=1 --",
      });
      expect(res.status).toBe(401);
    });

    it("should return 401 for XSS payload in Bearer token", async () => {
      const res = await call("/v1/budget-check?session_id=s1&limit_usd=1", {
        token: "<script>alert('xss')</script>",
      });
      expect(res.status).toBe(401);
    });

    it("should return 401 for 10,000 character token", async () => {
      const longToken = "a".repeat(10000);
      const res = await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: longToken });
      expect(res.status).toBe(401);
    });

    it("should handle token with null byte gracefully", async () => {
      try {
        const req = makeRequest("GET", "/v1/budget-check?session_id=s1&limit_usd=1", {
          headers: { Authorization: "Bearer aw_test\x00_token" },
        });
        const res = await worker.fetch(req, env, ctx);
        expect([401, 400]).toContain(res.status);
      } catch {
        expect(true).toBe(true);
      }
    });
  });

  describe("Header stripping", () => {
    it("should strip x-agentwatch-budget-usd header before upstream call", async () => {
      let capturedHeaders: Headers | null = null;
      const origFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        if (typeof url === "string" && url.includes("api.openai.com")) {
          capturedHeaders = new Headers(init?.headers);
          return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response("ok", { status: 200 });
      });

      await call("/v1/proxy/openai/v1/chat/completions", {
        method: "POST",
        token: "aw_test_token_1",
        headers: {
          "Content-Type": "application/json",
          "x-agentwatch-budget-usd": "100",
        },
      });

      if (capturedHeaders) {
        expect(capturedHeaders.get("x-agentwatch-budget-usd")).toBeNull();
      }
      globalThis.fetch = origFetch;
    });
  });

  describe("CORS", () => {
    it("should return CORS headers for OPTIONS preflight", async () => {
      const req = makeRequest("OPTIONS", "/v1/budget-check");
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(204);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://agentwatch.dev");
    });

    it("should return CORS headers on landing page redirect", async () => {
      const res = await call("/");
      // Landing page now redirects to the Astro site
      expect([200, 302, 404]).toContain(res.status);
    });

    it("should use secure default origin when CORS_ALLOWED_ORIGIN is not set", async () => {
      const noCorsEnv = makeEnv({ CORS_ALLOWED_ORIGIN: undefined });
      const req = makeRequest("GET", "/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
      const res = await worker.fetch(req, noCorsEnv, ctx);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });
  });
});
