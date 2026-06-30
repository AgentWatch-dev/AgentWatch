/**
 * Data Residency Routing tests.
 *
 * Tests the residency module which controls routing preferences for tenants.
 * IMPORTANT: This module controls routing PREFERENCES, not guarantees.
 * Cloudflare edge processing and Supabase replication are not controlled by this module.
 */

import { describe, it, expect } from "vitest";
import { getResidencyForProvider, shouldBlockForResidency, parseResidencyFromJson, type ResidencyConfig } from "../src/residency";

function makeConfig(overrides: Partial<ResidencyConfig> = {}): ResidencyConfig {
  return {
    tenant_id: "tenant_test",
    region: "global",
    data_residency_enforced: false,
    eu_fallback_allowed: false,
    ...overrides,
  };
}

describe("Residency config parsing", () => {
  it("parses valid config", () => {
    const config = parseResidencyFromJson({
      tenant_id: "t1",
      region: "eu",
      data_residency_enforced: true,
      eu_fallback_allowed: false,
    });
    expect(config.region).toBe("eu");
    expect(config.data_residency_enforced).toBe(true);
  });

  it("defaults to global when no config", () => {
    const config = parseResidencyFromJson(null);
    expect(config.region).toBe("global");
    expect(config.data_residency_enforced).toBe(false);
  });

  it("rejects invalid region", () => {
    const config = parseResidencyFromJson({ region: "invalid" });
    expect(config.region).toBe("global");
  });

  it("handles non-object input", () => {
    expect(parseResidencyFromJson("string").region).toBe("global");
    expect(parseResidencyFromJson(42).region).toBe("global");
  });
});

describe("Residency routing decisions", () => {
  it("returns null for global region (no routing needed)", () => {
    const config = makeConfig({ region: "global" });
    expect(getResidencyForProvider(config, "openai")).toBeNull();
  });

  it("returns null when residency not enforced", () => {
    const config = makeConfig({ region: "eu", data_residency_enforced: false });
    expect(getResidencyForProvider(config, "openai")).toBeNull();
  });

  it("returns EU endpoint for EU tenant with enforced residency", () => {
    const config = makeConfig({ region: "eu", data_residency_enforced: true });
    // OpenAI now has an EU endpoint configured
    const result = getResidencyForProvider(config, "openai");
    expect(result).not.toBeNull();
    expect(result!.regionTag).toBe("eu");
    expect(result!.baseUrl).toContain("eu.api.openai.com");
  });

  it("reports fallback allowed status", () => {
    const config = makeConfig({ region: "eu", data_residency_enforced: true, eu_fallback_allowed: true });
    const result = getResidencyForProvider(config, "openai");
    expect(result!.fallbackAllowed).toBe(true);
  });

  it("returns eu_no_endpoint for providers without EU endpoints", () => {
    const config = makeConfig({ region: "eu", data_residency_enforced: true });
    // Groq has no EU endpoint configured
    const result = getResidencyForProvider(config, "groq");
    expect(result).not.toBeNull();
    expect(result!.regionTag).toBe("eu_no_endpoint");
  });
});

describe("Residency blocking", () => {
  it("does not block when residency not enforced", () => {
    const config = makeConfig({ region: "eu", data_residency_enforced: false });
    const result = shouldBlockForResidency(config, "openai");
    expect(result.blocked).toBe(false);
  });

  it("blocks EU tenant when no EU endpoint and fallback not allowed", () => {
    const config = makeConfig({ region: "eu", data_residency_enforced: true, eu_fallback_allowed: false });
    // Groq has no EU endpoint
    const result = shouldBlockForResidency(config, "groq");
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("no EU-specific endpoint");
  });

  it("does not block EU tenant when fallback is allowed", () => {
    const config = makeConfig({ region: "eu", data_residency_enforced: true, eu_fallback_allowed: true });
    const result = shouldBlockForResidency(config, "openai");
    expect(result.blocked).toBe(false);
  });

  it("does not block for global region", () => {
    const config = makeConfig({ region: "global", data_residency_enforced: true });
    const result = shouldBlockForResidency(config, "openai");
    expect(result.blocked).toBe(false);
  });
});

describe("Honest limitations", () => {
  it("documents that OpenAI now has EU endpoint configured", () => {
    const config = makeConfig({ region: "eu", data_residency_enforced: true, eu_fallback_allowed: false });
    const result = shouldBlockForResidency(config, "openai");
    // OpenAI now has an EU endpoint, so it should NOT block
    expect(result.blocked).toBe(false);
  });

  it("blocks providers without EU endpoints when fallback not allowed", () => {
    const config = makeConfig({ region: "eu", data_residency_enforced: true, eu_fallback_allowed: false });
    // Groq has no EU endpoint
    const result = shouldBlockForResidency(config, "groq");
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("no EU-specific endpoint");
  });

  it("allows US region without blocking (no US-specific restrictions)", () => {
    const config = makeConfig({ region: "us", data_residency_enforced: true });
    const result = shouldBlockForResidency(config, "openai");
    expect(result.blocked).toBe(false);
  });
});
