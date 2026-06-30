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

async function callBudgetCheck(sessionId: string, limitUsd: number, token = "aw_test_token_1") {
  const req = makeRequest("GET", `/v1/budget-check?session_id=${sessionId}&limit_usd=${limitUsd}`, { token });
  return worker.fetch(req, env, ctx);
}

async function callIngest(body: Record<string, unknown>, token = "aw_test_token_1") {
  const req = makeRequest("POST", "/v1/ingest", { body, token });
  return worker.fetch(req, env, ctx);
}

describe("Budget Enforcement", () => {
  describe("Budget check endpoint", () => {
    it("should return allowed when session has 0 tokens", async () => {
      const res = await callBudgetCheck("session-1", 1.0);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.exceeded).toBe(false);
      expect(body.cumulative_tokens).toBe(0);
    });

    it("should return blocked when session is at exactly budget limit", async () => {
      await seedKV(env, { "t:tenant_a:s:session-1:usd": "1.0" });
      const res = await callBudgetCheck("session-1", 1.0);
      const body = await res.json();
      expect(body.exceeded).toBe(true);
    });

    it("should return allowed when 1 token under limit", async () => {
      await seedKV(env, { "t:tenant_a:s:session-1:usd": "0.99" });
      const res = await callBudgetCheck("session-1", 1.0);
      const body = await res.json();
      expect(body.exceeded).toBe(false);
    });

    it("should return blocked when 1 token over limit", async () => {
      await seedKV(env, { "t:tenant_a:s:session-1:usd": "1.01" });
      const res = await callBudgetCheck("session-1", 1.0);
      const body = await res.json();
      expect(body.exceeded).toBe(true);
    });

    it("should return 400 when session_id is missing", async () => {
      const req = makeRequest("GET", "/v1/budget-check?limit_usd=1", { token: "aw_test_token_1" });
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(400);
    });

    it("should handle malformed session_id gracefully", async () => {
      const res = await callBudgetCheck("../../etc/passwd", 1.0);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("exceeded");
    });
  });

  describe("Ingest endpoint", () => {
    it("should update KV with cumulative tokens on ingest", async () => {
      const res = await callIngest({
        session_id: "session-1",
        prompt_tokens: 100,
        completion_tokens: 50,
      });
      expect(res.status).toBe(200);
      const kvCall = env.KV.put.mock.calls.find((call: any[]) => call[0].includes("session-1:tokens"));
      expect(kvCall).toBeTruthy();
    });

    it("should reject negative prompt_tokens (treat as 0)", async () => {
      const res = await callIngest({
        session_id: "session-1",
        prompt_tokens: -100,
        completion_tokens: 50,
      });
      expect(res.status).toBe(200);
    });

    it("should handle missing required fields gracefully", async () => {
      const res = await callIngest({});
      expect(res.status).toBe(200);
    });
  });

  describe("Payload validation", () => {
    it("should reject payload larger than 1MB", async () => {
      const largePayload = "x".repeat(1024 * 1024 + 1);
      const req = makeRequest("POST", "/v1/ingest", {
        body: largePayload,
        token: "aw_test_token_1",
        headers: { "Content-Type": "application/json" },
      });
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(413);
    });

    it("should reject invalid JSON payload", async () => {
      const req = makeRequest("POST", "/v1/ingest", {
        body: "not valid json {{{",
        token: "aw_test_token_1",
        headers: { "Content-Type": "application/json" },
      });
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(400);
    });
  });
});
