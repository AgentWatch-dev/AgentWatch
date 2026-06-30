import { describe, it, expect } from "vitest";
import { analyzePayload } from "../src/classifier";

describe("PII Detection (classifier.ts)", () => {
  describe("Email detection", () => {
    it("should detect email in prompt", () => {
      const risks = analyzePayload("Contact user@example.com for details");
      expect(risks).toContain("PII_EMAIL");
    });

    it("should not false-positive on word 'email' without actual email", () => {
      const risks = analyzePayload("Please provide your email address");
      expect(risks).not.toContain("PII_EMAIL");
    });
  });

  describe("SSN detection", () => {
    it("should detect SSN format XXX-XX-XXXX", () => {
      const risks = analyzePayload("SSN: 123-45-6789");
      expect(risks).toContain("PII_SSN");
    });

    it("should detect SSN without dashes XXXXXXXXX", () => {
      const risks = analyzePayload("ID: 123456789");
      expect(risks).toContain("PII_SSN");
    });
  });

  describe("Credit card detection", () => {
    it("should detect valid Visa card", () => {
      // Visa test number that passes Luhn
      const risks = analyzePayload("Card: 4532015112830366");
      expect(risks).toContain("FINANCIAL_CREDIT_CARD");
    });

    it("should detect valid Mastercard", () => {
      const risks = analyzePayload("Card: 5555555555554444");
      expect(risks).toContain("FINANCIAL_CREDIT_CARD");
    });

    it("should detect valid Amex", () => {
      const risks = analyzePayload("Card: 378282246310005");
      expect(risks).toContain("FINANCIAL_CREDIT_CARD");
    });

    it("should NOT detect invalid credit card (fails Luhn)", () => {
      const risks = analyzePayload("Card: 1234567890123456");
      expect(risks).not.toContain("FINANCIAL_CREDIT_CARD");
    });
  });

  describe("AWS key detection", () => {
    it("should detect AWS access key (AKIA...)", () => {
      const risks = analyzePayload("Key: AKIAIOSFODNN7EXAMPLE");
      expect(risks).toContain("SECRET_AWS_ACCESS_KEY");
    });
  });

  describe("Stripe key detection", () => {
    it("should detect Stripe live key", () => {
      const risks = analyzePayload("Key: sk_live_4eC39HqLyjWDarjtT1zdp7dc");
      expect(risks).toContain("SECRET_STRIPE");
    });

    it("should detect Stripe test key", () => {
      const risks = analyzePayload("Key: sk_test_4eC39HqLyjWDarjtT1zdp7dc");
      expect(risks).toContain("SECRET_STRIPE");
    });
  });

  describe("GitHub token detection", () => {
    it("should detect GitHub token (ghp_...)", () => {
      const risks = analyzePayload("Token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl");
      expect(risks).toContain("SECRET_GITHUB");
    });
  });

  describe("JWT detection", () => {
    it("should detect JWT token", () => {
      // Construct a JWT-like string with proper header and high-entropy signature
      const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify({ sub: "1234567890", name: "Test User", email: "test@example.com" }));
      // Use a mix of characters to get high Shannon entropy (>= 3.5)
      const signature = "aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3h";
      const jwt = `${header}.${payload}.${signature}`;
      const risks = analyzePayload(`Token: ${jwt}`);
      expect(risks).toContain("SECRET_JWT");
    });
  });

  describe("Clean text", () => {
    it("should return empty array for clean text", () => {
      const risks = analyzePayload("Hello world, this is a normal message with no sensitive data.");
      expect(risks).toEqual([]);
    });

    it("should return empty array for empty string", () => {
      const risks = analyzePayload("");
      expect(risks).toEqual([]);
    });
  });

  describe("Multiple PII types", () => {
    it("should detect multiple PII types in same payload", () => {
      const risks = analyzePayload(
        "Email: test@example.com, SSN: 123-45-6789, Card: 4532015112830366"
      );
      expect(risks).toContain("PII_EMAIL");
      expect(risks).toContain("PII_SSN");
      expect(risks).toContain("FINANCIAL_CREDIT_CARD");
    });
  });

  describe("Edge cases", () => {
    it("should handle large payload without crashing", () => {
      const largeText = "a".repeat(500 * 1024); // 500KB
      const start = Date.now();
      const risks = analyzePayload(largeText);
      const elapsed = Date.now() - start;
      expect(Array.isArray(risks)).toBe(true);
      expect(elapsed).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle unicode text without crashing", () => {
      const risks = analyzePayload("こんにちは世界 テスト data@münchen.de");
      expect(Array.isArray(risks)).toBe(true);
    });

    it("should handle text with special characters", () => {
      const risks = analyzePayload("Price: $1,234.56 | Ref: #ABC-123");
      expect(Array.isArray(risks)).toBe(true);
    });
  });
});
