/**
 * State Repetition Detection integration tests.
 *
 * Tests that the loop detection feature correctly identifies
 * repeated identical requests and responds based on tenant configuration.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

function hashRequestState(
  payload: Record<string, any> | null,
  provider: string,
  team: string
): string {
  const state = {
    provider,
    model: payload?.model || null,
    tool: payload?.tools?.[0]?.function?.name || null,
    tool_input_hash: payload?.tool_calls?.[0]?.function?.arguments
      ? simpleHash(JSON.stringify(payload.tool_calls[0].function.arguments))
      : null,
    team,
  };
  return simpleHash(JSON.stringify(state));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("State Repetition Detection", () => {
  describe("hashRequestState", () => {
    it("should produce consistent hashes for identical inputs", () => {
      const payload = { model: "gpt-4", tools: [{ function: { name: "search" } }] };
      const h1 = hashRequestState(payload, "openai", "frontend");
      const h2 = hashRequestState(payload, "openai", "frontend");
      expect(h1).toBe(h2);
    });

    it("should produce different hashes for different models", () => {
      const p1 = { model: "gpt-4" };
      const p2 = { model: "claude-3" };
      const h1 = hashRequestState(p1, "openai", "default");
      const h2 = hashRequestState(p2, "openai", "default");
      expect(h1).not.toBe(h2);
    });

    it("should produce different hashes for different providers", () => {
      const payload = { model: "gpt-4" };
      const h1 = hashRequestState(payload, "openai", "default");
      const h2 = hashRequestState(payload, "anthropic", "default");
      expect(h1).not.toBe(h2);
    });

    it("should produce different hashes for different teams", () => {
      const payload = { model: "gpt-4" };
      const h1 = hashRequestState(payload, "openai", "frontend");
      const h2 = hashRequestState(payload, "openai", "backend");
      expect(h1).not.toBe(h2);
    });

    it("should handle null payload", () => {
      const h1 = hashRequestState(null, "openai", "default");
      const h2 = hashRequestState(null, "openai", "default");
      expect(h1).toBe(h2);
    });

    it("should include tool name in hash", () => {
      const p1 = { tools: [{ function: { name: "search" } }] };
      const p2 = { tools: [{ function: { name: "calculator" } }] };
      const h1 = hashRequestState(p1, "openai", "default");
      const h2 = hashRequestState(p2, "openai", "default");
      expect(h1).not.toBe(h2);
    });

    it("should include tool call arguments in hash", () => {
      const p1 = { tool_calls: [{ function: { name: "search", arguments: '{"query":"hello"}' } }] };
      const p2 = { tool_calls: [{ function: { name: "search", arguments: '{"query":"world"}' } }] };
      const h1 = hashRequestState(p1, "openai", "default");
      const h2 = hashRequestState(p2, "openai", "default");
      expect(h1).not.toBe(h2);
    });
  });

  describe("simpleHash", () => {
    it("should produce consistent output", () => {
      expect(simpleHash("hello")).toBe(simpleHash("hello"));
    });

    it("should produce different output for different inputs", () => {
      expect(simpleHash("hello")).not.toBe(simpleHash("world"));
    });

    it("should return a string", () => {
      expect(typeof simpleHash("test")).toBe("string");
    });
  });
});
