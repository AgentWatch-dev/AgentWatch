import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { makeEnv, makeRequest, makeCtx, seedKV, mockSupabaseRPC } from "./helpers";

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

describe("Full Proxy Flow — End-to-End", () => {
  it("should forward request to upstream provider and return response", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlStr.includes("api.openai.com")) {
        return new Response(JSON.stringify({
          id: "chatcmpl-123",
          object: "chat.completion",
          choices: [{ message: { role: "assistant", content: "Hello!" } }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("ok", { status: 200 });
    });

    const req = makeRequest("POST", "/v1/proxy/openai/chat/completions", {
      token: "aw_test_token_1:sk-fake-key",
      body: { model: "gpt-4o", messages: [{ role: "user", content: "Hi" }] }
    });

    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.choices[0].message.content).toBe("Hello!");
  });

  it("should return 401 for missing auth", async () => {
    const req = makeRequest("POST", "/v1/proxy/openai/chat/completions", {
      body: { model: "gpt-4o", messages: [{ role: "user", content: "Hi" }] }
    });
    // Remove auth header
    req.headers.delete("Authorization");

    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(401);
  });

  it("should handle unsupported provider gracefully", async () => {
    const req = makeRequest("POST", "/v1/proxy/unsupported/chat/completions", {
      token: "aw_test_token_1:sk-fake-key",
      body: { model: "gpt-4o", messages: [{ role: "user", content: "Hi" }] }
    });

    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(404);
  });

  it("should return CORS headers on OPTIONS preflight", async () => {
    const req = makeRequest("OPTIONS", "/v1/proxy/openai/chat/completions", {
      token: "aw_test_token_1:sk-fake-key"
    });
    req.headers.set("Origin", "https://agent-watch.dev");
    req.headers.set("Access-Control-Request-Method", "POST");

    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(204);
  });

  it("should handle GET / landing page", async () => {
    const req = makeRequest("GET", "/");
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(200);
  });
});
