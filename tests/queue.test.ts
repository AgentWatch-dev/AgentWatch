import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { makeEnv, makeCtx } from "./helpers";

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

describe("Queue Handler — Telemetry Pipeline", () => {
  it("should process a batch of messages and ack each", async () => {
    let supabaseCalled = false;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlStr.includes("supabase.co")) {
        supabaseCalled = true;
        return new Response(null, { status: 200 });
      }
      return new Response("ok", { status: 200 });
    });

    const messages = [
      { body: { tenant_id: "tenant_a", model: "gpt-4o", provider: "openai", upstream_path: "/v1/chat/completions", request_started_at: new Date().toISOString(), response_status: 200, is_stream: false, prompt_tokens: 100, completion_tokens: 50, total_latency_ms: 200, proxy_overhead_ms: 5, upstream_ttfb_ms: 150, upstream_request_id: null, identified_risks: [], cumulative_tokens_in_session: 150, project: null, team: null, agent: null, session_id: null, iteration_index: null, error: null }, ack: vi.fn(), retry: vi.fn() },
      { body: { tenant_id: "tenant_b", model: "claude-3", provider: "anthropic", upstream_path: "/v1/messages", request_started_at: new Date().toISOString(), response_status: 200, is_stream: false, prompt_tokens: 200, completion_tokens: 100, total_latency_ms: 300, proxy_overhead_ms: 8, upstream_ttfb_ms: 250, upstream_request_id: null, identified_risks: [], cumulative_tokens_in_session: 300, project: null, team: null, agent: null, session_id: null, iteration_index: null, error: null }, ack: vi.fn(), retry: vi.fn() },
    ];

    const batch = { messages, queue: "agentwatch-telemetry" } as any;

    await worker.queue(batch, env);

    expect(supabaseCalled).toBe(true);
    expect(messages[0].ack).toHaveBeenCalled();
    expect(messages[1].ack).toHaveBeenCalled();
    expect(messages[0].retry).not.toHaveBeenCalled();
    expect(messages[1].retry).not.toHaveBeenCalled();
  });

  it("should retry on Supabase failure", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlStr.includes("supabase.co")) {
        return new Response("error", { status: 500 });
      }
      return new Response("ok", { status: 200 });
    });

    const msg = {
      body: { tenant_id: "tenant_a", model: "gpt-4o", provider: "openai", upstream_path: "/v1/chat/completions", request_started_at: new Date().toISOString(), response_status: 200, is_stream: false, prompt_tokens: 100, completion_tokens: 50, total_latency_ms: 200, proxy_overhead_ms: 5, upstream_ttfb_ms: 150, upstream_request_id: null, identified_risks: [], cumulative_tokens_in_session: 150, project: null, team: null, agent: null, session_id: null, iteration_index: null, error: null },
      ack: vi.fn(),
      retry: vi.fn()
    };

    const batch = { messages: [msg], queue: "agentwatch-telemetry" } as any;

    await worker.queue(batch, env);

    expect(msg.ack).not.toHaveBeenCalled();
    expect(msg.retry).toHaveBeenCalled();
  });

  it("should handle empty batch", async () => {
    const batch = { messages: [], queue: "agentwatch-telemetry" } as any;

    await expect(worker.queue(batch, env)).resolves.not.toThrow();
  });

  it("should process mixed success/failure batch", async () => {
    let callCount = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlStr.includes("supabase.co")) {
        callCount++;
        if (callCount === 1) return new Response(null, { status: 200 });
        return new Response("error", { status: 500 });
      }
      return new Response("ok", { status: 200 });
    });

    const msg1 = {
      body: { tenant_id: "tenant_a", model: "gpt-4o", provider: "openai", upstream_path: "/v1/chat/completions", request_started_at: new Date().toISOString(), response_status: 200, is_stream: false, prompt_tokens: 100, completion_tokens: 50, total_latency_ms: 200, proxy_overhead_ms: 5, upstream_ttfb_ms: 150, upstream_request_id: null, identified_risks: [], cumulative_tokens_in_session: 150, project: null, team: null, agent: null, session_id: null, iteration_index: null, error: null },
      ack: vi.fn(),
      retry: vi.fn()
    };
    const msg2 = {
      body: { tenant_id: "tenant_b", model: "gpt-4o", provider: "openai", upstream_path: "/v1/chat/completions", request_started_at: new Date().toISOString(), response_status: 200, is_stream: false, prompt_tokens: 100, completion_tokens: 50, total_latency_ms: 200, proxy_overhead_ms: 5, upstream_ttfb_ms: 150, upstream_request_id: null, identified_risks: [], cumulative_tokens_in_session: 150, project: null, team: null, agent: null, session_id: null, iteration_index: null, error: null },
      ack: vi.fn(),
      retry: vi.fn()
    };

    const batch = { messages: [msg1, msg2], queue: "agentwatch-telemetry" } as any;

    await worker.queue(batch, env);

    expect(msg1.ack).toHaveBeenCalled();
    expect(msg1.retry).not.toHaveBeenCalled();
    expect(msg2.ack).not.toHaveBeenCalled();
    expect(msg2.retry).toHaveBeenCalled();
  });
});
