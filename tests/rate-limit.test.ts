import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeEnv, makeRequest, makeCtx } from "./helpers";

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

async function call(path: string, opts: { method?: string; token?: string } = {}) {
  const req = makeRequest(opts.method || "GET", path, { token: opts.token });
  return worker.fetch(req, env, ctx);
}

describe("Rate Limiting", () => {
  it("should allow 99 requests from same tenant within 60s", async () => {
    env.RATE_LIMITER = { limit: vi.fn(async () => ({ success: true })) };
    for (let i = 0; i < 99; i++) {
      const res = await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
      expect(res.status).toBe(200);
    }
  });

  it("should return 429 on 101st request from same tenant", async () => {
    let count = 0;
    env.RATE_LIMITER = {
      limit: vi.fn(async () => {
        count++;
        return { success: count <= 100 };
      }),
    };
    for (let i = 0; i < 100; i++) {
      await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
    }
    const res = await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
    expect(res.status).toBe(429);
  });

  it("should reset rate limit after 60s window", async () => {
    let count = 0;
    env.RATE_LIMITER = {
      limit: vi.fn(async () => {
        count++;
        return { success: count <= 2 };
      }),
    };
    // First 2 should pass
    await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
    await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
    // Third should fail
    const res3 = await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
    expect(res3.status).toBe(429);

    // Reset the mock to simulate window expiry
    count = 0;
    env.RATE_LIMITER = {
      limit: vi.fn(async () => ({ success: true })),
    };
    // Should pass again
    const res4 = await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
    expect(res4.status).toBe(200);
  });

  it("should not affect different tenants", async () => {
    let tenantACount = 0;
    let tenantBCount = 0;
    env.RATE_LIMITER = {
      limit: vi.fn(async ({ key }: { key: string }) => {
        if (key.startsWith("tenant_a")) {
          tenantACount++;
          return { success: tenantACount <= 1 };
        }
        tenantBCount++;
        return { success: true };
      }),
    };
    // Tenant A: first request passes
    await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
    // Tenant A: second request blocked
    const resA = await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
    expect(resA.status).toBe(429);
    // Tenant B: still passes
    const resB = await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_2" });
    expect(resB.status).toBe(200);
  });

  it("should apply rate limit per-tenant, not globally", async () => {
    let limitCalls: string[] = [];
    env.RATE_LIMITER = {
      limit: vi.fn(async ({ key }: { key: string }) => {
        limitCalls.push(key);
        return { success: true };
      }),
    };
    await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
    await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_2" });
    // Each call should use its own tenant key (includes :team suffix)
    expect(limitCalls[0]).toMatch(/^tenant_a/);
    expect(limitCalls[1]).toMatch(/^tenant_b/);
  });

  it("should bypass rate limiting for /healthz", async () => {
    env.RATE_LIMITER = {
      limit: vi.fn(async () => ({ success: false })),
    };
    const res = await call("/healthz");
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toBe("ok");
  });

  it("should deny when RATE_LIMITER binding is absent (secure default)", async () => {
    env.RATE_LIMITER = undefined;
    const res = await call("/v1/budget-check?session_id=s1&limit_usd=1", { token: "aw_test_token_1" });
    expect(res.status).toBe(429);
  });
});
