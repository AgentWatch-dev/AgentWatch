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

describe("Compliance & Residency", () => {
  describe("Compliance report", () => {
    it("should return 401 for /v1/compliance/report without auth", async () => {
      const req = makeRequest("GET", "/v1/compliance/report");
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(401);
    });

    it("should return data for /v1/compliance/report with auth", async () => {
      vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("supabase.co")) {
          return new Response(JSON.stringify({
            tenant_id: "tenant_a",
            period_start: "2026-01-01",
            period_end: "2026-01-07",
            total_cost: 100,
            total_requests: 500,
            risk_counts: {},
            provider_breakdown: [],
          }), { status: 200, headers: { "content-type": "application/json" } });
        }
        return new Response("ok", { status: 200 });
      }));

      const res = await call("/v1/compliance/report", { token: "aw_test_token_1" });
      expect(res.status).toBe(200);
    });

    it("should return JSON for /v1/compliance/report?format=json", async () => {
      vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("supabase.co")) {
          return new Response(JSON.stringify({
            tenant_id: "tenant_a",
            period_start: "2026-01-01",
            period_end: "2026-01-07",
            total_cost: 100,
            total_requests: 500,
            risk_counts: {},
            provider_breakdown: [],
          }), { status: 200, headers: { "content-type": "application/json" } });
        }
        return new Response("ok", { status: 200 });
      }));

      const res = await call("/v1/compliance/report?format=json", { token: "aw_test_token_1" });
      expect(res.status).toBe(200);
    });
  });

  describe("Residency", () => {
    it("should return 401 for /v1/residency without auth", async () => {
      const req = makeRequest("GET", "/v1/residency");
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(401);
    });

    it("should return 200 for /v1/residency with auth", async () => {
      // Residency requires Enterprise plan
      await env.KV.put("tenant:plan:tenant_a", JSON.stringify({ plan: "enterprise" }));
      const res = await call("/v1/residency", { token: "aw_test_token_1" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toBeDefined();
    });

    it("should update residency via POST /v1/residency", async () => {
      // Residency requires Enterprise plan
      await env.KV.put("tenant:plan:tenant_a", JSON.stringify({ plan: "enterprise" }));
      const res = await call("/v1/residency", {
        method: "POST",
        token: "aw_test_token_1",
        body: { region: "eu", enforced: true, fallback_allowed: false },
      });
      expect(res.status).toBe(200);
    });
  });

  describe("Team budgets", () => {
    it("should return 401 for /v1/teams/budgets without auth", async () => {
      const req = makeRequest("GET", "/v1/teams/budgets");
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(401);
    });

    it("should return budgets for /v1/teams/budgets with auth", async () => {
      // Budgets require Pro plan
      await env.KV.put("tenant:plan:tenant_a", JSON.stringify({ plan: "pro" }));
      vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("supabase.co")) {
          return new Response(JSON.stringify([
            { team: "payments-eng", monthly_budget_usd: 100, current_spend: 50 }
          ]), { status: 200, headers: { "content-type": "application/json" } });
        }
        return new Response("ok", { status: 200 });
      }));

      const res = await call("/v1/teams/budgets", { token: "aw_test_token_1" });
      expect(res.status).toBe(200);
    });

    it("should upsert team budget via POST /v1/teams/budgets", async () => {
      vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("supabase.co")) {
          return new Response("ok", { status: 200 });
        }
        return new Response("ok", { status: 200 });
      }));

      const res = await call("/v1/teams/budgets", {
        method: "POST",
        token: "aw_test_token_1",
        body: { team: "payments-eng", monthly_budget_usd: 200, alert_threshold_pct: 80, hard_stop: true },
      });
      expect(res.status).toBe(200);
    });
  });
});
