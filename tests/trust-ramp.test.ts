/**
 * Trust Ramp end-to-end tests.
 *
 * Tests the three governance modes (Observe, Soft, Hard),
 * soft warning injection, per-request overrides, and
 * governance timeline view.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { makeEnv, makeRequest, makeCtx, getWorker, seedKV } from "./helpers";

let worker: any;
let env: any;
let ctx: any;

beforeEach(async () => {
  worker = await getWorker();
  env = makeEnv();
  ctx = makeCtx();
});

// ---------------------------------------------------------------------------
// Governance Modes
// ---------------------------------------------------------------------------

describe("Trust Ramp — Governance Modes", () => {
  describe("Observe mode", () => {
    it("should allow all requests in observe mode", async () => {
      await seedKV(env, { "tenant:settings:tenant_a": JSON.stringify({ governance_mode: "observe" }) });

      const req = makeRequest("POST", "/v1/proxy/openai/chat/completions", {
        token: "aw_test_token_1:sk-fake-key",
        body: { model: "gpt-4", messages: [{ role: "user", content: "Hello" }] },
      });

      const res = await worker.fetch(req, env, ctx);
      // Observe mode should NOT block
      expect(res.status).not.toBe(402);
      expect(res.status).not.toBe(403);
      expect(res.status).not.toBe(429);
    });
  });

  describe("Soft mode (default)", () => {
    it("should default to soft mode when no setting exists", async () => {
      const req = makeRequest("POST", "/v1/proxy/openai/chat/completions", {
        token: "aw_test_token_1:sk-fake-key",
        body: { model: "gpt-4", messages: [{ role: "user", content: "Hello" }] },
      });

      const res = await worker.fetch(req, env, ctx);
      // Soft mode should NOT block
      expect(res.status).not.toBe(402);
      expect(res.status).not.toBe(403);
    });

    it("should allow requests in soft mode even with budget warnings", async () => {
      await seedKV(env, { "tenant:settings:tenant_a": JSON.stringify({ governance_mode: "soft" }) });

      const req = makeRequest("POST", "/v1/proxy/openai/chat/completions", {
        token: "aw_test_token_1:sk-fake-key",
        body: { model: "gpt-4", messages: [{ role: "user", content: "Hello" }] },
      });

      const res = await worker.fetch(req, env, ctx);
      // Soft mode: warn but don't block
      expect(res.status).not.toBe(402);
      expect(res.status).not.toBe(403);
    });
  });

  describe("Hard mode", () => {
    it("should enforce policies in hard mode", async () => {
      await seedKV(env, { "tenant:settings:tenant_a": JSON.stringify({ governance_mode: "hard" }) });

      const req = makeRequest("POST", "/v1/proxy/openai/chat/completions", {
        token: "aw_test_token_1:sk-fake-key",
        body: { model: "gpt-4", messages: [{ role: "user", content: "Hello" }] },
      });

      const res = await worker.fetch(req, env, ctx);
      // Hard mode enforces — with default settings it should still allow
      // (no budget exceeded, no PII detected)
      expect(res.status).not.toBe(403);
    });
  });
});

// ---------------------------------------------------------------------------
// Per-request mode override
// ---------------------------------------------------------------------------

describe("Trust Ramp — Per-Request Override", () => {
  it("should override global mode with x-agentwatch-governance-mode header", async () => {
    // Global is soft, request overrides to observe
    const req = makeRequest("POST", "/v1/proxy/openai/chat/completions", {
      token: "aw_test_token_1:sk-fake-key",
      body: { model: "gpt-4", messages: [{ role: "user", content: "Hello" }] },
      headers: { "x-agentwatch-governance-mode": "observe" },
    });

    const res = await worker.fetch(req, env, ctx);
    expect(res.status).not.toBe(402);
    expect(res.status).not.toBe(403);
  });

  it("should allow hard mode override on specific requests", async () => {
    const req = makeRequest("POST", "/v1/proxy/openai/chat/completions", {
      token: "aw_test_token_1:sk-fake-key",
      body: { model: "gpt-4", messages: [{ role: "user", content: "Hello" }] },
      headers: { "x-agentwatch-governance-mode": "hard" },
    });

    const res = await worker.fetch(req, env, ctx);
    // Hard mode with no violations should still allow
    expect(res.status).not.toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Governance timeline endpoint
// ---------------------------------------------------------------------------

describe("Trust Ramp — Governance Timeline", () => {
  it("should require session_id parameter", async () => {
    const req = makeRequest("GET", "/v1/dashboard/timeline", {
      token: "aw_test_token_1",
    });
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(400);
  });

  it("should return empty events for unknown session", async () => {
    const req = makeRequest("GET", "/v1/dashboard/timeline?session_id=unknown", {
      token: "aw_test_token_1",
    });
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events).toEqual([]);
    expect(body.session_id).toBe("unknown");
  });

  it("should require authentication", async () => {
    const req = makeRequest("GET", "/v1/dashboard/timeline?session_id=test");
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Settings persistence
// ---------------------------------------------------------------------------

describe("Trust Ramp — Settings Persistence", () => {
  it("should save governance mode via settings endpoint", async () => {
    const req = makeRequest("POST", "/v1/dashboard/settings", {
      token: "aw_test_token_1",
      body: { governance_mode: "hard", block_on_pii: true, loop_detection_action: "alert" },
    });
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(200);

    // Verify it was saved
    const settingsReq = makeRequest("GET", "/v1/dashboard/settings", {
      token: "aw_test_token_1",
    });
    const settingsRes = await worker.fetch(settingsReq, env, ctx);
    const body = await settingsRes.json();
    expect(body.governance_mode).toBe("hard");
    expect(body.block_on_pii).toBe(true);
    expect(body.loop_detection_action).toBe("alert");
  });

  it("should load governance mode in settings GET", async () => {
    await seedKV(env, { "tenant:settings:tenant_a": JSON.stringify({ governance_mode: "soft", block_on_pii: true }) });

    const req = makeRequest("GET", "/v1/dashboard/settings", {
      token: "aw_test_token_1",
    });
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.governance_mode).toBe("soft");
    expect(body.block_on_pii).toBe(true);
  });
});
