import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { makeEnv, makeCtx } from "./helpers";
import { createScheduledController } from "cloudflare:test";

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

describe("Cron Scheduled Events", () => {
  it("should process weekly compliance reports via scheduled handler", async () => {
    let resendCalled = false;
    let supabaseCalled = false;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : (url as Request).url || url.toString();
      
      if (urlStr.includes("supabase.co")) {
        supabaseCalled = true;
        // Mock get_tenant_rules RPC for reporting
        return new Response(JSON.stringify([{
          tenant_id: "tenant_a",
          pii_enabled: true,
          compliance_hipaa: true
        }]), { status: 200, headers: { "content-type": "application/json" } });
      }
      
      if (urlStr.includes("api.resend.com/emails")) {
        resendCalled = true;
        return new Response(JSON.stringify({ id: "mock_resend_id" }), { status: 200, headers: { "content-type": "application/json" } });
      }
      
      return new Response("ok", { status: 200 });
    });

    const scheduledController = createScheduledController({
      cron: "0 8 * * 1",
      scheduledTime: Date.now()
    });

    await worker.scheduled(scheduledController, env, ctx);
    await Promise.all(ctx._waitUntilPromises);

    expect(supabaseCalled).toBe(true);
    expect(resendCalled).toBe(true);
  });
});
