import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
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

describe("Dashboard API", () => {
  describe("Dashboard HTML", () => {
    it("should return HTML for GET /v1/dashboard without auth", async () => {
      const req = makeRequest("GET", "/v1/dashboard");
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
      const contentType = res.headers.get("content-type");
      expect(contentType).toContain("text/html");
    });
  });

  describe("Dashboard endpoints with auth", () => {
    it("should return 401 for /v1/dashboard/summary without auth", async () => {
      const req = makeRequest("GET", "/v1/dashboard/summary");
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(401);
    });

    it("should return 200 with valid auth for /v1/dashboard/summary", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("supabase.co")) {
          return new Response(JSON.stringify({ total_cost: 100, total_requests: 500 }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response("ok", { status: 200 });
      });

      const req = makeRequest("GET", "/v1/dashboard/summary", { token: "aw_test_token_1" });
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("total_cost");
    });

    it("should return 200 with valid auth for /v1/dashboard/sessions", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("supabase.co")) {
          return new Response(JSON.stringify([{ session_id: "s1", total_cost: 1.5 }]), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response("ok", { status: 200 });
      });

      const req = makeRequest("GET", "/v1/dashboard/sessions", { token: "aw_test_token_1" });
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body[0]).toHaveProperty("session_id");
    });

    it("should return 200 with valid auth for /v1/dashboard/anomalies", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("supabase.co")) {
          return new Response(JSON.stringify([{ session_id: "s1", anomaly_type: "spike" }]), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response("ok", { status: 200 });
      });

      const req = makeRequest("GET", "/v1/dashboard/anomalies", { token: "aw_test_token_1" });
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body[0]).toHaveProperty("anomaly_type");
    });

    it("should return 200 with valid auth for /v1/dashboard/spend-trend", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("supabase.co")) {
          return new Response(JSON.stringify([{ date: "2026-06-15", cost: 10 }]), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response("ok", { status: 200 });
      });

      const req = makeRequest("GET", "/v1/dashboard/spend-trend", { token: "aw_test_token_1" });
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body[0]).toHaveProperty("cost");
    });

    it("should return 200 with valid auth for /v1/dashboard/providers", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("supabase.co")) {
          return new Response(JSON.stringify([{ provider: "openai", total_cost: 5 }]), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response("ok", { status: 200 });
      });

      const req = makeRequest("GET", "/v1/dashboard/providers", { token: "aw_test_token_1" });
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body[0]).toHaveProperty("provider");
    });
  });

  describe("Error handling", () => {
    it("should return 200 with fallback data when Supabase is not configured", async () => {
      const noSupabaseEnv = makeEnv({ SUPABASE_URL: undefined });
      const req = makeRequest("GET", "/v1/dashboard/summary", { token: "aw_test_token_1" });
      const res = await worker.fetch(req, noSupabaseEnv, ctx);
      expect(res.status).toBe(200);
    });
  });

  describe("Analytics volume", () => {
    it("should return 401 without auth", async () => {
      const req = makeRequest("GET", "/v1/dashboard/analytics/volume");
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(401);
    });

    it("should return 200 with hourly data", async () => {
      const req = makeRequest("GET", "/v1/dashboard/analytics/volume", { token: "aw_test_token_1" });
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("hourly");
      expect(Array.isArray(body.hourly)).toBe(true);
    });

    it("should return mock data when Supabase is not configured", async () => {
      const noSupabaseEnv = makeEnv({ SUPABASE_URL: undefined });
      const req = makeRequest("GET", "/v1/dashboard/analytics/volume", { token: "aw_test_token_1" });
      const res = await worker.fetch(req, noSupabaseEnv, ctx);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.hourly.length).toBe(24);
    });
  });
});
