import { describe, it, expect } from "vitest";
import { generateSoc2Export, type Soc2Export } from "../src/compliance";

function makeSoc2Export(overrides: Partial<Soc2Export> = {}): Soc2Export {
  return {
    tenantId: "tenant_soc2_test",
    generatedAt: "2026-06-23T12:00:00Z",
    periodStart: "2026-05-24T12:00:00Z",
    periodEnd: "2026-06-23T12:00:00Z",
    controls: [
      { control: "CC6.1", category: "Logical Access", status: "implemented", evidence: "Role-based access control", lastVerified: "2026-06-20T00:00:00Z" },
      { control: "CC6.2", category: "Logical Access", status: "implemented", evidence: "JWT authentication", lastVerified: "2026-06-20T00:00:00Z" },
    ],
    accessLogs: [
      { id: "1", timestamp: "2026-06-23T10:00:00Z", action: "proxy_request", ip: "1.2.3.4", user_agent: "Mozilla/5.0", status: 200 },
      { id: "2", timestamp: "2026-06-23T11:00:00Z", action: "api_key_create", ip: "5.6.7.8", user_agent: "curl/8.0", status: 201 },
    ],
    authEvents: [
      { id: "a1", timestamp: "2026-06-23T09:00:00Z", event_type: "saml_auth_success", subject: "user@test.com", ip: "1.2.3.4", metadata: { session_index: "abc" } },
    ],
    dataRetention: {
      enabled: true,
      retentionDays: 90,
      policy: "Logs retained for 90 days."
    },
    summary: {
      totalAccessLogs: 2,
      totalAuthEvents: 1,
      uniqueIps: 2,
      failedAuthAttempts: 0,
      controlsImplemented: 2,
      controlsTotal: 2
    },
    ...overrides,
  };
}

describe("SOC 2 Evidence Export HTML generation", () => {
  it("generates valid HTML", () => {
    const html = generateSoc2Export(makeSoc2Export());
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("includes title and tenant ID", () => {
    const html = generateSoc2Export(makeSoc2Export());
    expect(html).toContain("SOC 2 Type II Evidence Export");
    expect(html).toContain("tenant_soc2_test");
  });

  it("includes period dates", () => {
    const html = generateSoc2Export(makeSoc2Export());
    expect(html).toContain("2026-05-24");
    expect(html).toContain("2026-06-23");
  });

  it("includes summary grid", () => {
    const html = generateSoc2Export(makeSoc2Export());
    expect(html).toContain("Controls Implemented");
    expect(html).toContain("Access Log Entries");
    expect(html).toContain("Auth Events");
    expect(html).toContain("Unique IPs");
    expect(html).toContain("Failed Auth Attempts");
  });

  it("includes CC6.1 controls table", () => {
    const html = generateSoc2Export(makeSoc2Export());
    expect(html).toContain("CC6.1 Logical Access Controls");
    expect(html).toContain("CC6.1");
    expect(html).toContain("CC6.2");
    expect(html).toContain("Role-based access control");
  });

  it("includes API access log table", () => {
    const html = generateSoc2Export(makeSoc2Export());
    expect(html).toContain("API Access Log");
    expect(html).toContain("proxy_request");
    expect(html).toContain("1.2.3.4");
  });

  it("includes data retention section", () => {
    const html = generateSoc2Export(makeSoc2Export());
    expect(html).toContain("Data Retention");
    expect(html).toContain("90 days");
    expect(html).toContain("Logs retained for 90 days.");
  });

  it("includes footer", () => {
    const html = generateSoc2Export(makeSoc2Export());
    expect(html).toContain("AgentWatch SOC 2 Type II Evidence Export");
  });

  it("handles empty access logs", () => {
    const html = generateSoc2Export(makeSoc2Export({ accessLogs: [] }));
    expect(html).toContain("No access log entries in period");
  });

  it("handles empty auth events", () => {
    const html = generateSoc2Export(makeSoc2Export({ authEvents: [] }));
    expect(html).toContain("SOC 2 Type II Evidence Export");
  });

  it("escapes HTML in tenant ID", () => {
    const html = generateSoc2Export(makeSoc2Export({ tenantId: '<script>alert("xss")</script>' }));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML in access log user agent", () => {
    const html = generateSoc2Export(makeSoc2Export({
      accessLogs: [{ id: "1", timestamp: "2026-06-23T10:00:00Z", action: "test", ip: "1.2.3.4", user_agent: '<img onerror="alert(1)">', status: 200 }]
    }));
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("limits access logs to 100 entries", () => {
    const logs = Array.from({ length: 120 }, (_, i) => ({
      id: String(i), timestamp: "2026-06-23T10:00:00Z", action: `action_${i}`, ip: "1.2.3.4", user_agent: "test", status: 200
    }));
    const html = generateSoc2Export(makeSoc2Export({ accessLogs: logs }));
    const rowCount = (html.match(/<td>action_\d+<\/td>/g) || []).length;
    expect(rowCount).toBeLessThanOrEqual(100);
  });
});

describe("SOC 2 Export data structure", () => {
  it("has required fields", () => {
    const report = makeSoc2Export();
    expect(report.tenantId).toBeDefined();
    expect(report.generatedAt).toBeDefined();
    expect(report.periodStart).toBeDefined();
    expect(report.periodEnd).toBeDefined();
    expect(report.controls).toBeDefined();
    expect(report.accessLogs).toBeDefined();
    expect(report.authEvents).toBeDefined();
    expect(report.dataRetention).toBeDefined();
    expect(report.summary).toBeDefined();
  });

  it("summary reflects control counts", () => {
    const report = makeSoc2Export();
    expect(report.summary.controlsImplemented).toBe(report.controls.length);
    expect(report.summary.controlsTotal).toBe(report.controls.length);
  });
});
