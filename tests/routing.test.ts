import { describe, it, expect, beforeEach, vi } from "vitest";
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

describe("H7: Bedrock Region Validation", () => {
  it("should accept valid AWS region us-east-1", async () => {
    const req = makeRequest("POST", "/v1/proxy/bedrock/us-east-1/model/test", {
      token: "aw_test_token_1:AKIAIOSFODNN7EXAMPLE",
      headers: { "Content-Type": "application/json" },
      body: { model: "test", messages: [{ role: "user", content: "test" }] },
    });
    // Should not return 404 for invalid route (region accepted)
    const res = await worker.fetch(req, env, ctx);
    // Will fail at upstream fetch (expected), but should NOT fail at routing
    expect(res.status).not.toBe(404);
  });

  it("should accept valid AWS region eu-west-1", async () => {
    const req = makeRequest("POST", "/v1/proxy/bedrock/eu-west-1/model/test", {
      token: "aw_test_token_1:AKIAIOSFODNN7EXAMPLE",
      headers: { "Content-Type": "application/json" },
      body: { model: "test", messages: [{ role: "user", content: "test" }] },
    });
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).not.toBe(404);
  });

  it("should accept valid AWS region ap-southeast-1", async () => {
    const req = makeRequest("POST", "/v1/proxy/bedrock/ap-southeast-1/model/test", {
      token: "aw_test_token_1:AKIAIOSFODNN7EXAMPLE",
      headers: { "Content-Type": "application/json" },
      body: { model: "test", messages: [{ role: "user", content: "test" }] },
    });
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).not.toBe(404);
  });

  it("should reject invalid region xx-evil-1", async () => {
    const req = makeRequest("POST", "/v1/proxy/bedrock/xx-evil-1/model/test", {
      token: "aw_test_token_1:AKIAIOSFODNN7EXAMPLE",
      headers: { "Content-Type": "application/json" },
      body: { model: "test", messages: [{ role: "user", content: "test" }] },
    });
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(404);
  });

  it("should reject region with hostname injection evil.attacker.com", async () => {
    const req = makeRequest("POST", "/v1/proxy/bedrock/evil.attacker.com/model/test", {
      token: "aw_test_token_1:AKIAIOSFODNN7EXAMPLE",
      headers: { "Content-Type": "application/json" },
      body: { model: "test", messages: [{ role: "user", content: "test" }] },
    });
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(404);
  });
});
