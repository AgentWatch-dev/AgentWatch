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

async function call(path: string, opts: { method?: string; token?: string; body?: any } = {}) {
  const req = makeRequest(opts.method || "GET", path, { token: opts.token, body: opts.body });
  return worker.fetch(req, env, ctx);
}

describe("Custom Rules Engine — Integration", () => {
  describe("Rules storage and retrieval", () => {
    it("should retrieve rules via GET /v1/rules", async () => {
      await seedKV(env, {
        "t:tenant_a:rules": JSON.stringify([
          { name: "test-rule", condition: {}, action: "alert", priority: 100, enabled: true },
        ]),
      });
      const res = await call("/v1/rules", { token: "aw_test_token_1" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });

  describe("Rules auth", () => {
    it("should return 401 for rules endpoint without auth", async () => {
      const req = makeRequest("GET", "/v1/rules");
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(401);
    });
  });

  describe("Rules isolation", () => {
    it("should not return Tenant A's rules for Tenant B", async () => {
      await seedKV(env, {
        "t:tenant_a:rules": JSON.stringify([
          { name: "tenant-a-rule", condition: {}, action: "alert", priority: 100, enabled: true },
        ]),
      });
      const res = await call("/v1/rules", { token: "aw_test_token_2" });
      expect(res.status).toBe(200);
      const body = await res.json();
      if (Array.isArray(body)) {
        const hasTenantARule = body.some((r: any) => r.name === "tenant-a-rule");
        expect(hasTenantARule).toBe(false);
      }
    });
  });
});
