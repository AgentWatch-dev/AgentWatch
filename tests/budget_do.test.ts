/**
 * BudgetTracker Durable Object tests.
 *
 * Tests the atomic budget enforcement, monthly request counting,
 * and state repetition detection methods.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { env } from "cloudflare:test";

describe("BudgetTracker Durable Object", () => {
  function getBudgetTracker(tenantId: string) {
    const id = env.BUDGET_TRACKER.idFromName(`budget:${tenantId}`);
    return env.BUDGET_TRACKER.get(id);
  }

  describe("Session Budget", () => {
    it("should allow requests under budget", async () => {
      const tracker = getBudgetTracker("tenant_1");
      const result = await tracker.checkSessionBudget("sess_1", 1.0, 0.5);
      expect(result.allowed).toBe(true);
      expect(result.spentUsd).toBe(0);
    });

    it("should deny requests over budget", async () => {
      const tracker = getBudgetTracker("tenant_2");
      await tracker.deductSessionCost("sess_1", 0.8);
      const result = await tracker.checkSessionBudget("sess_1", 1.0, 0.5);
      expect(result.allowed).toBe(false);
      expect(result.spentUsd).toBe(0.8);
    });

    it("should track cumulative spending", async () => {
      const tracker = getBudgetTracker("tenant_3");
      await tracker.deductSessionCost("sess_1", 0.1);
      await tracker.deductSessionCost("sess_1", 0.2);
      await tracker.deductSessionCost("sess_1", 0.3);
      const spent = await tracker.getSessionSpent("sess_1");
      expect(spent).toBeCloseTo(0.6);
    });

    it("should set budget on first request, read on subsequent", async () => {
      const tracker = getBudgetTracker("tenant_4");
      const first = await tracker.setSessionBudget("sess_1", 2.0);
      expect(first).toBe(2.0);
      const second = await tracker.setSessionBudget("sess_1", 5.0);
      expect(second).toBe(2.0);
    });
  });

  describe("Monthly Request Counter", () => {
    it("should increment count atomically", async () => {
      const tracker = getBudgetTracker("tenant_5");
      const r1 = await tracker.incrementMonthlyRequests("tenant_5", "2026-06", 100);
      expect(r1.count).toBe(1);
      expect(r1.allowed).toBe(true);
      const r2 = await tracker.incrementMonthlyRequests("tenant_5", "2026-06", 100);
      expect(r2.count).toBe(2);
      expect(r2.allowed).toBe(true);
    });

    it("should deny when limit exceeded", async () => {
      const tracker = getBudgetTracker("tenant_6");
      const result = await tracker.incrementMonthlyRequests("tenant_6", "2026-06", 2);
      expect(result.count).toBe(1);
      expect(result.allowed).toBe(true);
      const result2 = await tracker.incrementMonthlyRequests("tenant_6", "2026-06", 2);
      expect(result2.count).toBe(2);
      expect(result2.allowed).toBe(true);
      const result3 = await tracker.incrementMonthlyRequests("tenant_6", "2026-06", 2);
      expect(result3.count).toBe(3);
      expect(result3.allowed).toBe(false);
    });

    it("should read count without incrementing", async () => {
      const tracker = getBudgetTracker("tenant_7");
      await tracker.incrementMonthlyRequests("tenant_7", "2026-06", 100);
      await tracker.incrementMonthlyRequests("tenant_7", "2026-06", 100);
      const count = await tracker.getMonthlyRequestCount("2026-06");
      expect(count).toBe(2);
    });
  });

  describe("State Repetition Detection", () => {
    it("should not flag first occurrence", async () => {
      const tracker = getBudgetTracker("tenant_11");
      const result = await tracker.trackSessionState("sess_1", "hash_abc", 2);
      expect(result.isRepeat).toBe(false);
      expect(result.repeatCount).toBe(1);
    });

    it("should flag second identical state", async () => {
      const tracker = getBudgetTracker("tenant_12");
      await tracker.trackSessionState("sess_1", "hash_abc", 2);
      const result = await tracker.trackSessionState("sess_1", "hash_abc", 2);
      expect(result.isRepeat).toBe(true);
      expect(result.repeatCount).toBe(2);
    });

    it("should not flag different states", async () => {
      const tracker = getBudgetTracker("tenant_13");
      await tracker.trackSessionState("sess_1", "hash_abc", 2);
      await tracker.trackSessionState("sess_1", "hash_def", 2);
      const result = await tracker.trackSessionState("sess_1", "hash_ghi", 2);
      expect(result.isRepeat).toBe(false);
    });

    it("should count multiple repeats correctly", async () => {
      const tracker = getBudgetTracker("tenant_14");
      await tracker.trackSessionState("sess_1", "hash_abc", 5);
      await tracker.trackSessionState("sess_1", "hash_abc", 5);
      const result = await tracker.trackSessionState("sess_1", "hash_abc", 5);
      expect(result.isRepeat).toBe(true);
      expect(result.repeatCount).toBe(3);
    });

    it("should return session states history", async () => {
      const tracker = getBudgetTracker("tenant_15");
      await tracker.trackSessionState("sess_1", "hash_a", 5);
      await tracker.trackSessionState("sess_1", "hash_b", 5);
      await tracker.trackSessionState("sess_1", "hash_c", 5);
      const states = await tracker.getSessionStates("sess_1");
      expect(states).toEqual(["hash_a", "hash_b", "hash_c"]);
    });

    it("should reset session states", async () => {
      const tracker = getBudgetTracker("tenant_16");
      await tracker.trackSessionState("sess_1", "hash_a", 5);
      await tracker.resetSessionStates("sess_1");
      const states = await tracker.getSessionStates("sess_1");
      expect(states).toEqual([]);
    });
  });
});
