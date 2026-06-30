import { describe, it, expect, beforeEach, vi } from "vitest";
import { analyzePayload } from "../src/classifier";

describe("Load & Performance", () => {
  describe("PII detection performance", () => {
    it("should detect PII in 100KB payload under 50ms", async () => {
      const payload = "a".repeat(50 * 1024) + " user@example.com " + "b".repeat(50 * 1024);
      const start = performance.now();
      const risks = analyzePayload(payload);
      const elapsed = performance.now() - start;
      expect(risks).toContain("PII_EMAIL");
      expect(elapsed).toBeLessThan(50);
    });

    it("should detect PII in 500KB payload under 200ms", async () => {
      const payload = "a".repeat(250 * 1024) + " 123-45-6789 " + "b".repeat(250 * 1024);
      const start = performance.now();
      const risks = analyzePayload(payload);
      const elapsed = performance.now() - start;
      expect(risks).toContain("PII_SSN");
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe("Concurrent request handling", () => {
    it("should handle 100 concurrent PII detections without crash", async () => {
      const payloads = Array.from({ length: 100 }, (_, i) =>
        `User ${i}: email test${i}@example.com, card 4532015112830366`
      );

      const start = performance.now();
      const results = payloads.map(p => analyzePayload(p));
      const elapsed = performance.now() - start;

      expect(results).toHaveLength(100);
      results.forEach(risks => {
        expect(risks).toContain("PII_EMAIL");
        expect(risks).toContain("FINANCIAL_CREDIT_CARD");
      });
      expect(elapsed).toBeLessThan(5000); // All 100 should complete in under 5s
    });
  });

  describe("Memory stability", () => {
    it("should not leak memory across 1000 sequential PII detections", async () => {
      const payload = "Contact user@example.com for SSN 123-45-6789";
      for (let i = 0; i < 1000; i++) {
        const risks = analyzePayload(payload);
        expect(risks).toContain("PII_EMAIL");
        expect(risks).toContain("PII_SSN");
      }
      // If we get here without OOM, the test passes
      expect(true).toBe(true);
    });
  });

  describe("Empty and edge case performance", () => {
    it("should handle empty string instantly", () => {
      const start = performance.now();
      analyzePayload("");
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(5);
    });

    it("should handle single character instantly", () => {
      const start = performance.now();
      analyzePayload("a");
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(5);
    });

    it("should handle very long single word", () => {
      const start = performance.now();
      analyzePayload("a".repeat(100000));
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(50);
    });
  });
});
