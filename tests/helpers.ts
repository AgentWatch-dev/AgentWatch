import { vi } from "vitest";
import { env as cfEnv, createExecutionContext } from "cloudflare:test";

// ── Mock Env Factory ──
export function makeEnv(overrides: Record<string, any> = {}): any {
  // Inject required test tokens that were previously hardcoded
  // Inject required test tokens unconditionally so tests don't fail if wrangler.toml has real tokens
  (cfEnv as any).TENANT_TOKEN_MAP = JSON.stringify({ "aw_test_token_1": "tenant_a", "aw_test_token_2": "tenant_b" });
  (cfEnv as any).REPORT_RECIPIENT_MAP = JSON.stringify({ "tenant_a": "test@example.com" });
  (cfEnv as any)._planSeeded = (cfEnv as any)._planSeeded || false;
  if (!(cfEnv as any)._planSeeded) {
    (cfEnv as any)._planSeeded = true;
    cfEnv.KV.put("tenant:plan:tenant_a", JSON.stringify({ plan: "pro" }));
    cfEnv.KV.put("tenant:plan:tenant_b", JSON.stringify({ plan: "pro" }));
  }
  
  // Spy on native KV bindings
  if (!("mock" in cfEnv.KV.put)) {
    vi.spyOn(cfEnv.KV, "get");
    vi.spyOn(cfEnv.KV, "put");
    vi.spyOn(cfEnv.KV, "delete");
    vi.spyOn(cfEnv.KV, "list");
  }

  // Spy on Queue
  if (!("mock" in cfEnv.TELEMETRY_QUEUE.send)) {
    vi.spyOn(cfEnv.TELEMETRY_QUEUE, "send");
    vi.spyOn(cfEnv.TELEMETRY_QUEUE, "sendBatch");
  }

  // Spy on Rate Limiter
  if (!("mock" in cfEnv.RATE_LIMITER.limit)) {
    vi.spyOn(cfEnv.RATE_LIMITER, "limit");
  }

  // Spy on Durable Objects
  if (!("mock" in cfEnv.SESSION_TRACKER.get)) {
     const originalGet = cfEnv.SESSION_TRACKER.get.bind(cfEnv.SESSION_TRACKER);
     (cfEnv.SESSION_TRACKER as any).get = vi.fn((id: any) => {
       const stub = originalGet(id);
       if (!("mock" in stub.fetch)) vi.spyOn(stub, "fetch");
       return stub;
     });
  }

  return {
    ...cfEnv,
    ...overrides,
    _kvStore: {
      set: async (k: string, v: string) => { await cfEnv.KV.put(k, v); },
      get: async (k: string) => await cfEnv.KV.get(k),
      delete: async (k: string) => await cfEnv.KV.delete(k)
    }
  };
}

// ── Import worker fresh each time ──
export async function getWorker() {
  const mod = await import("../src/index");
  return mod.default;
}

// ── Mock Fetch for Supabase ──
export function mockSupabaseFetch(response: any = { data: [], error: null }) {
  return vi.fn(async () => {
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
}

// ── Mock ExecutionContext ──
export function makeCtx(): any {
  const ctx = createExecutionContext();
  
  if (!("mock" in ctx.waitUntil)) {
    vi.spyOn(ctx, "waitUntil");
    vi.spyOn(ctx, "passThroughOnException");
  }
  
  // Some tests manually check this array, so we recreate it on the mock ctx wrapper
  const mockCtx = {
    waitUntil: (p: any) => { (ctx.waitUntil as any).mock.calls.push([p]); ctx.waitUntil(p); },
    passThroughOnException: () => ctx.passThroughOnException(),
    _waitUntilPromises: [] as any[]
  };
  return mockCtx;
}

// ── Request Factory ──
export function makeRequest(
  method: string,
  path: string,
  opts: {
    body?: string | object;
    headers?: Record<string, string>;
    token?: string;
  } = {}
): Request {
  const headers: Record<string, string> = { ...opts.headers };
  if (opts.token) {
    headers["Authorization"] = `Bearer ${opts.token}`;
  }
  const body = opts.body
    ? typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body)
    : undefined;
  return new Request(`https://agentwatch.dev${path}`, { method, headers, body });
}

// ── Call Worker Fetch ──
export async function callWorker(worker: any, request: Request, env?: any, ctx?: any) {
  const mockEnv = env || makeEnv();
  const mockCtx = ctx || makeCtx();
  return worker.fetch(request, mockEnv, mockCtx);
}

// ── KV Store Helpers ──
export async function seedKV(env: any, entries: Record<string, string>) {
  for (const [key, value] of Object.entries(entries)) {
    await env.KV.put(key, value);
  }
}

// ── Supabase RPC Mock ──
export function mockSupabaseRPC(env: any, response: any) {
  env.SUPABASE_URL = "https://test.supabase.co";
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = typeof url === "string" ? url : url.toString();
    if (urlStr.includes("supabase.co")) {
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("not mocked", { status: 501 });
  });
}
