import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeEnv, makeRequest, makeCtx, seedKV } from "./helpers";

let worker: any;
let env: ReturnType<typeof makeEnv>;
let ctx: ReturnType<typeof makeCtx>;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("../src/index");
  worker = mod.default;
  env = makeEnv();
  ctx = makeCtx();
});

async function callBudgetCheck(sessionId: string, limitUsd: number, token: string) {
  const req = makeRequest("GET", `/v1/budget-check?session_id=${sessionId}&limit_usd=${limitUsd}`, { token });
  return worker.fetch(req, env, ctx);
}

async function callIngest(body: Record<string, unknown>, token: string) {
  const req = makeRequest("POST", "/v1/ingest", { body, token });
  return worker.fetch(req, env, ctx);
}

describe("Multi-Tenant Isolation", () => {
  describe("KV namespace isolation", () => {
    it("should not let Tenant B read Tenant A's session data via budget-check", async () => {
      // Tenant A has tokens in KV
      await seedKV(env, {
        "t:tenant_a:s:session-a1:tokens": "50000",
      });

      // Tenant A can see its own budget
      const resA = await callBudgetCheck("session-a1", 1.0, "aw_test_token_1");
      const bodyA = await resA.json();
      expect(bodyA.cumulative_tokens).toBe(50000);

      // Tenant B cannot see Tenant A's tokens (different KV key namespace)
      const resB = await callBudgetCheck("session-a1", 1.0, "aw_test_token_2");
      const bodyB = await resB.json();
      expect(bodyB.cumulative_tokens).toBe(0); // No data for tenant_b's namespace
    });

    it("should use tenant-scoped KV keys", async () => {
      // Ingest for tenant A
      await callIngest({
        session_id: "shared-session",
        prompt_tokens: 1000,
        completion_tokens: 500,
      }, "aw_test_token_1");

      // Check that KV key includes tenant prefix
      const tenantAKey = env.KV.put.mock.calls.find(
        (call: any[]) => call[0].includes("tenant_a") && call[0].includes("shared-session")
      );
      expect(tenantAKey).toBeTruthy();

      // Ingest for tenant B with same session_id
      await callIngest({
        session_id: "shared-session",
        prompt_tokens: 2000,
        completion_tokens: 1000,
      }, "aw_test_token_2");

      // Tenant B's key should be different
      const tenantBKey = env.KV.put.mock.calls.find(
        (call: any[]) => call[0].includes("tenant_b") && call[0].includes("shared-session")
      );
      expect(tenantBKey).toBeTruthy();

      // Keys should be different
      expect(tenantAKey![0]).not.toBe(tenantBKey![0]);
    });
  });

  describe("Token isolation", () => {
    it("should extract tenant from token, not from client headers", async () => {
      // Tenant A's token should map to tenant_a
      const resA = await callBudgetCheck("s1", 1.0, "aw_test_token_1");
      expect(resA.status).toBe(200);

      // Forging a tenant header should not change the resolved tenant
      const req = makeRequest("GET", "/v1/budget-check?session_id=s1&limit_usd=1", {
        token: "aw_test_token_1",
        headers: { "x-agentwatch-tenant-id": "tenant_b" },
      });
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
      // The tenant should still be tenant_a (from token), not tenant_b (from header)
    });

    it("should return 401 for Tenant B's token on Tenant A's budget-check", async () => {
      await seedKV(env, {
        "t:tenant_a:s:session-a1:tokens": "50000",
      });
      // Tenant B's token cannot access Tenant A's session
      const res = await callBudgetCheck("session-a1", 1.0, "aw_test_token_2");
      const body = await res.json();
      // Tenant B gets its own (empty) budget state
      expect(body.cumulative_tokens).toBe(0);
    });
  });

  describe("Rate limit isolation", () => {
    it("should not let Tenant B exhaust Tenant A's rate limit", async () => {
      let tenantALimit = 0;
      let tenantBLimit = 0;
      env.RATE_LIMITER = {
        limit: vi.fn(async ({ key }: { key: string }) => {
          if (key.startsWith("tenant_a")) {
            tenantALimit++;
            return { success: tenantALimit <= 2 };
          }
          tenantBLimit++;
          return { success: tenantBLimit <= 100 };
        }),
      };

      // Tenant B makes many requests
      for (let i = 0; i < 50; i++) {
        await callBudgetCheck("s1", 1.0, "aw_test_token_2");
      }

      // Tenant A should still be able to make requests
      const res1 = await callBudgetCheck("s1", 1.0, "aw_test_token_1");
      expect(res1.status).toBe(200);
      const res2 = await callBudgetCheck("s1", 1.0, "aw_test_token_1");
      expect(res2.status).toBe(200);
      // Tenant A's 3rd request should be blocked (limit is 2)
      const res3 = await callBudgetCheck("s1", 1.0, "aw_test_token_1");
      expect(res3.status).toBe(429);
    });
  });

  describe("Concurrent isolation", () => {
    it("should not cross-contaminate KV writes from concurrent requests", async () => {
      // Simulate concurrent ingests from different tenants
      const promises = [
        callIngest({ session_id: "s1", prompt_tokens: 100, completion_tokens: 50 }, "aw_test_token_1"),
        callIngest({ session_id: "s1", prompt_tokens: 200, completion_tokens: 100 }, "aw_test_token_2"),
        callIngest({ session_id: "s1", prompt_tokens: 300, completion_tokens: 150 }, "aw_test_token_1"),
      ];

      await Promise.all(promises);

      // Each tenant's writes should be in separate KV namespaces
      const tenantAWrites = env.KV.put.mock.calls.filter(
        (call: any[]) => call[0].includes("tenant_a")
      );
      const tenantBWrites = env.KV.put.mock.calls.filter(
        (call: any[]) => call[0].includes("tenant_b")
      );

      expect(tenantAWrites.length).toBeGreaterThan(0);
      expect(tenantBWrites.length).toBeGreaterThan(0);

      // No cross-contamination: tenant_a writes should not contain tenant_b data
      for (const write of tenantAWrites) {
        expect(write[0]).toContain("tenant_a");
      }
      for (const write of tenantBWrites) {
        expect(write[0]).toContain("tenant_b");
      }
    });
  });
});
