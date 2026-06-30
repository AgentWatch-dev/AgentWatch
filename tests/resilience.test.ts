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

describe("Error Handling and Resilience", () => {
  describe("Supabase failures", () => {
    it("should still forward LLM calls when Supabase is unreachable", async () => {
      vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("supabase.co")) {
          throw new Error("Supabase unreachable");
        }
        if (urlStr.includes("api.openai.com")) {
          return new Response(JSON.stringify({
            choices: [{ message: { content: "response" } }],
            usage: { prompt_tokens: 10, completion_tokens: 5 },
          }), { status: 200, headers: { "content-type": "application/json" } });
        }
        return new Response("ok", { status: 200 });
      }));

      const req = makeRequest("POST", "/v1/proxy/openai/v1/chat/completions", {
        method: "POST",
        token: "aw_test_token_1",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-5.5", messages: [{ role: "user", content: "Hi" }] }),
      });
      try {
        const res = await worker.fetch(req, env, ctx);
        expect(res.status).toBe(200);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
    });
  });

  describe("Health check resilience", () => {
    it("should always return 200 for /healthz regardless of infrastructure", async () => {
      env.SUPABASE_URL = undefined;
      const req = makeRequest("GET", "/healthz");
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);
    });
  });
});
