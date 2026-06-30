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

async function call(path: string, opts: { method?: string; token?: string; body?: any; headers?: Record<string, string> } = {}) {
  const req = makeRequest(opts.method || "GET", path, { token: opts.token, body: opts.body, headers: opts.headers });
  return worker.fetch(req, env, ctx);
}

describe("Input Validation & Edge Cases", () => {
  describe("Payload size limits", () => {
    it("should reject POST /v1/ingest with payload > 1MB", async () => {
      const largePayload = "x".repeat(1024 * 1024 + 1);
      const res = await call("/v1/ingest", {
        method: "POST",
        token: "aw_test_token_1",
        body: largePayload,
        headers: { "Content-Type": "application/json" },
      });
      expect(res.status).toBe(413);
    });
  });

  describe("Token validation", () => {
    it("should reject negative prompt_tokens in ingest", async () => {
      const res = await call("/v1/ingest", {
        method: "POST",
        token: "aw_test_token_1",
        body: { session_id: "s1", prompt_tokens: -100, completion_tokens: 50 },
      });
      expect(res.status).toBe(200);
    });

    it("should reject non-finite prompt_tokens", async () => {
      const res = await call("/v1/ingest", {
        method: "POST",
        token: "aw_test_token_1",
        body: { session_id: "s1", prompt_tokens: Infinity, completion_tokens: 50 },
      });
      expect(res.status).toBe(200);
    });
  });

  describe("Missing required fields", () => {
    it("should return 400 for missing session_id in budget-check", async () => {
      const res = await call("/v1/budget-check?limit_usd=1", { token: "aw_test_token_1" });
      expect(res.status).toBe(400);
    });

    it("should handle ingest with missing fields gracefully", async () => {
      const res = await call("/v1/ingest", {
        method: "POST",
        token: "aw_test_token_1",
        body: {},
      });
      expect(res.status).toBe(200);
    });
  });

  describe("Invalid JSON", () => {
    it("should return 400 for invalid JSON in ingest", async () => {
      const res = await call("/v1/ingest", {
        method: "POST",
        token: "aw_test_token_1",
        body: "not json {{{",
        headers: { "Content-Type": "application/json" },
      });
      expect(res.status).toBe(400);
    });

    it("should return 400 for empty body in ingest", async () => {
      const req = makeRequest("POST", "/v1/ingest", {
        token: "aw_test_token_1",
        body: "",
        headers: { "Content-Type": "application/json" },
      });
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(400);
    });
  });

  describe("Session ID sanitization", () => {
    it("should handle session_id with path traversal", async () => {
      const res = await call("/v1/budget-check?session_id=../../etc/passwd&limit_usd=1", {
        token: "aw_test_token_1",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("exceeded");
    });
  });

  describe("HTTP method validation", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await call("/v1/nonexistent");
      expect(res.status).toBe(404);
    });

    it("should handle OPTIONS requests correctly", async () => {
      const req = makeRequest("OPTIONS", "/v1/ingest");
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(204);
    });
  });

  describe("Header handling", () => {
    it("should handle request with many custom headers without crashing", async () => {
      const headers: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        headers[`x-custom-header-${i}`] = `value-${i}`;
      }
      const res = await call("/v1/budget-check?session_id=s1&limit_usd=1", {
        token: "aw_test_token_1",
        headers,
      });
      expect(res.status).toBe(200);
    });
  });
});
