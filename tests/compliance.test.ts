/**
 * EU AI Act Compliance Report tests.
 *
 * Tests the report HTML generator independently of the edge proxy.
 * The generator is pure: given a ComplianceReport object, it produces HTML.
 */

import { describe, it, expect } from "vitest";
import { generateReportHtml, type ComplianceReport } from "../src/compliance";

function makeReport(overrides: Partial<ComplianceReport> = {}): ComplianceReport {
  return {
    tenant_id: "tenant_test123",
    report_type: "eu_ai_act",
    period_start: "2026-05-15T00:00:00Z",
    period_end: "2026-06-14T00:00:00Z",
    generated_at: "2026-06-14T12:00:00Z",
    summary: {
      total_requests: 28419,
      total_sessions: 342,
      total_teams: 5,
      total_providers: 4,
      total_models: 8,
      total_tokens: 84000000,
      error_count: 34,
      error_rate: 0.12,
      stream_count: 12000,
      flagged_count: 17,
      first_request: "2026-05-15T00:01:00Z",
      last_request: "2026-06-14T23:59:00Z",
    },
    risk_events: { PII_EMAIL: 8, SECRET_AWS_ACCESS_KEY: 3, FINANCIAL_CREDIT_CARD: 6 },
    provider_breakdown: [
      { provider: "openai", model: "gpt-5.5", requests: 12890, tokens: 42000000, avg_latency_ms: 423, errors: 8 },
      { provider: "anthropic", model: "claude-sonnet-4.6", requests: 4680, tokens: 18000000, avg_latency_ms: 512, errors: 3 },
    ],
    daily_volume: [
      { day: "2026-06-01T00:00:00Z", requests: 2800, tokens: 8400000 },
      { day: "2026-06-02T00:00:00Z", requests: 3100, tokens: 9300000 },
    ],
    high_volume_sessions: [
      { session_id: "ci-run-447", team: "payments-eng", model: "gpt-5.5", max_iteration: 4820, request_count: 4820 },
    ],
    compliance_status: {
      monitoring_active: true,
      data_retention_days: 90,
      risk_detection_enabled: true,
      budget_enforcement_enabled: true,
      pii_screening_enabled: true,
    },
    ...overrides,
  };
}

describe("Compliance Report HTML generation", () => {
  it("generates valid HTML", () => {
    const html = generateReportHtml(makeReport());
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
    expect(html).toContain("EU AI Act Compliance Report");
  });

  it("includes tenant ID", () => {
    const html = generateReportHtml(makeReport());
    expect(html).toContain("tenant_test123");
  });

  it("includes period dates", () => {
    const html = generateReportHtml(makeReport());
    expect(html).toContain("2026-05-15");
    expect(html).toContain("2026-06-14");
  });

  it("includes summary metrics", () => {
    const html = generateReportHtml(makeReport());
    expect(html).toContain("28,419"); // total_requests
    expect(html).toContain("342"); // total_sessions
    expect(html).toContain("0.12%"); // error_rate
  });

  it("includes risk events", () => {
    const html = generateReportHtml(makeReport());
    expect(html).toContain("PII_EMAIL");
    expect(html).toContain("SECRET_AWS_ACCESS_KEY");
    expect(html).toContain("FINANCIAL_CREDIT_CARD");
  });

  it("includes provider breakdown", () => {
    const html = generateReportHtml(makeReport());
    expect(html).toContain("openai");
    expect(html).toContain("anthropic");
    expect(html).toContain("gpt-5.5");
  });

  it("includes compliance status badges", () => {
    const html = generateReportHtml(makeReport());
    expect(html).toContain("Monitoring");
    expect(html).toContain("Risk Detection");
    expect(html).toContain("Budget Enforcement");
    expect(html).toContain("PII Screening");
    expect(html).toContain("Active");
  });

  it("handles empty risk events", () => {
    const html = generateReportHtml(makeReport({ risk_events: {} }));
    expect(html).toContain("No risk events detected");
  });

  it("handles empty provider breakdown", () => {
    const html = generateReportHtml(makeReport({ provider_breakdown: [] }));
    expect(html).toContain("Provider Breakdown");
  });

  it("handles no high-volume sessions", () => {
    const html = generateReportHtml(makeReport({ high_volume_sessions: [] }));
    expect(html).toContain("No high-volume sessions detected");
  });

  it("escapes HTML in tenant ID", () => {
    const html = generateReportHtml(makeReport({ tenant_id: '<script>alert("xss")</script>' }));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML in model names", () => {
    const report = makeReport({
      provider_breakdown: [{ provider: "openai", model: '<img onerror="alert(1)">', requests: 1, tokens: 100, avg_latency_ms: 100, errors: 0 }],
    });
    const html = generateReportHtml(report);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});

describe("Compliance Report data structure", () => {
  it("has required fields", () => {
    const report = makeReport();
    expect(report.tenant_id).toBeDefined();
    expect(report.report_type).toBe("eu_ai_act");
    expect(report.period_start).toBeDefined();
    expect(report.period_end).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(report.compliance_status).toBeDefined();
  });

  it("compliance status reflects active monitoring", () => {
    const report = makeReport();
    expect(report.compliance_status.monitoring_active).toBe(true);
    expect(report.compliance_status.risk_detection_enabled).toBe(true);
    expect(report.compliance_status.budget_enforcement_enabled).toBe(true);
    expect(report.compliance_status.pii_screening_enabled).toBe(true);
    expect(report.compliance_status.data_retention_days).toBe(90);
  });
});
