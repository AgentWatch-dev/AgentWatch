/**
 * SLA Monitoring Module tests.
 *
 * Tests uptime calculation, incident detection, and SLA report generation.
 */

import { describe, it, expect } from "vitest";
import {
  getSlaConfig,
  calculateUptime,
  detectIncidents,
  generateSlaReport,
  generateSlaReportHtml,
  type UptimeRecord,
} from "../src/sla";

function makeRecord(overrides: Partial<UptimeRecord> = {}): UptimeRecord {
  return {
    timestamp: "2026-06-20T12:00:00Z",
    status: "up",
    latencyMs: 100,
    statusCode: 200,
    error: null,
    ...overrides,
  };
}

describe("getSlaConfig", () => {
  it("returns enterprise config for enterprise plan", () => {
    const config = getSlaConfig("enterprise");
    expect(config.targetUptime).toBe(99.9);
    expect(config.maxDowntimeMinutes).toBe(43.2);
  });

  it("returns pro config for pro plan", () => {
    const config = getSlaConfig("pro");
    expect(config.targetUptime).toBe(99.5);
    expect(config.maxDowntimeMinutes).toBe(216);
  });

  it("returns free config for free plan", () => {
    const config = getSlaConfig("free");
    expect(config.targetUptime).toBe(99);
    expect(config.maxDowntimeMinutes).toBe(432);
  });

  it("returns free config for unknown plan", () => {
    const config = getSlaConfig("unknown");
    expect(config.targetUptime).toBe(99);
  });
});

describe("calculateUptime", () => {
  it("returns 100% uptime for empty records", () => {
    const result = calculateUptime([]);
    expect(result.uptimePct).toBe(100);
    expect(result.totalChecks).toBe(0);
  });

  it("calculates correct uptime percentage", () => {
    const records: UptimeRecord[] = [
      makeRecord({ status: "up" }),
      makeRecord({ status: "up" }),
      makeRecord({ status: "down" }),
      makeRecord({ status: "up" }),
    ];
    const result = calculateUptime(records);
    expect(result.uptimePct).toBe(75);
    expect(result.totalChecks).toBe(4);
    expect(result.upChecks).toBe(3);
    expect(result.downChecks).toBe(1);
  });

  it("counts degraded checks separately", () => {
    const records: UptimeRecord[] = [
      makeRecord({ status: "up" }),
      makeRecord({ status: "degraded" }),
    ];
    const result = calculateUptime(records);
    expect(result.upChecks).toBe(1);
    expect(result.degradedChecks).toBe(1);
  });

  it("calculates latency metrics", () => {
    const records: UptimeRecord[] = [
      makeRecord({ latencyMs: 100 }),
      makeRecord({ latencyMs: 200 }),
      makeRecord({ latencyMs: 300 }),
    ];
    const result = calculateUptime(records);
    expect(result.latency.avgMs).toBe(200);
    expect(result.latency.maxMs).toBe(300);
    expect(result.latency.p99Ms).toBe(300);
  });
});

describe("detectIncidents", () => {
  it("returns empty for all-up records", () => {
    const records: UptimeRecord[] = [
      makeRecord({ status: "up", timestamp: "2026-06-20T12:00:00Z" }),
      makeRecord({ status: "up", timestamp: "2026-06-20T12:01:00Z" }),
    ];
    const incidents = detectIncidents(records);
    expect(incidents).toHaveLength(0);
  });

  it("detects a single downtime incident", () => {
    const records: UptimeRecord[] = [
      makeRecord({ status: "up", timestamp: "2026-06-20T12:00:00Z" }),
      makeRecord({ status: "down", timestamp: "2026-06-20T12:01:00Z", error: "Connection timeout" }),
      makeRecord({ status: "down", timestamp: "2026-06-20T12:02:00Z", error: "Connection timeout" }),
      makeRecord({ status: "up", timestamp: "2026-06-20T12:03:00Z" }),
    ];
    const incidents = detectIncidents(records);
    expect(incidents).toHaveLength(1);
    expect(incidents[0].durationMinutes).toBeCloseTo(2, 0);
    expect(incidents[0].cause).toBe("Connection timeout");
  });

  it("detects multiple incidents", () => {
    const records: UptimeRecord[] = [
      makeRecord({ status: "up", timestamp: "2026-06-20T12:00:00Z" }),
      makeRecord({ status: "down", timestamp: "2026-06-20T12:01:00Z" }),
      makeRecord({ status: "up", timestamp: "2026-06-20T12:02:00Z" }),
      makeRecord({ status: "down", timestamp: "2026-06-20T12:03:00Z" }),
      makeRecord({ status: "up", timestamp: "2026-06-20T12:04:00Z" }),
    ];
    const incidents = detectIncidents(records);
    expect(incidents).toHaveLength(2);
  });

  it("handles open-ended incident at end of records", () => {
    const records: UptimeRecord[] = [
      makeRecord({ status: "up", timestamp: "2026-06-20T12:00:00Z" }),
      makeRecord({ status: "down", timestamp: "2026-06-20T12:01:00Z" }),
    ];
    const incidents = detectIncidents(records);
    expect(incidents).toHaveLength(1);
    expect(incidents[0].start).toBe("2026-06-20T12:01:00Z");
  });
});

describe("generateSlaReport", () => {
  it("generates report with correct structure", () => {
    const records: UptimeRecord[] = [
      makeRecord({ status: "up", timestamp: "2026-06-20T12:00:00Z", latencyMs: 100 }),
      makeRecord({ status: "up", timestamp: "2026-06-20T12:01:00Z", latencyMs: 200 }),
    ];
    const config = getSlaConfig("enterprise");
    const report = generateSlaReport("tenant_test", records, config);

    expect(report.tenantId).toBe("tenant_test");
    expect(report.targetUptime).toBe(99.9);
    expect(report.actualUptime).toBe(100);
    expect(report.uptimeMet).toBe(true);
    expect(report.totalChecks).toBe(2);
    expect(report.downtimeWithinBudget).toBe(true);
    expect(report.incidents).toHaveLength(0);
    expect(report.generatedAt).toBeDefined();
  });

  it("marks SLA as not met when uptime is below target", () => {
    const records: UptimeRecord[] = [];
    for (let i = 0; i < 100; i++) {
      records.push(makeRecord({ status: "up", timestamp: `2026-06-20T12:${String(i).padStart(2, "0")}:00Z` }));
    }
    records.push(makeRecord({ status: "down", timestamp: "2026-06-20T13:41:00Z" }));

    const config = getSlaConfig("enterprise");
    const report = generateSlaReport("tenant_test", records, config);
    expect(report.uptimeMet).toBe(false);
  });
});

describe("generateSlaReportHtml", () => {
  it("generates valid HTML", () => {
    const report = generateSlaReport("tenant_test", [
      makeRecord({ status: "up", timestamp: "2026-06-20T12:00:00Z" }),
    ], getSlaConfig("enterprise"));

    const html = generateSlaReportHtml(report);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
    expect(html).toContain("SLA Monitoring Report");
    expect(html).toContain("tenant_test");
  });

  it("escapes HTML in tenant ID", () => {
    const report = generateSlaReport('<script>alert("xss")</script>', [], getSlaConfig("enterprise"));
    const html = generateSlaReportHtml(report);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("shows no incidents message when empty", () => {
    const report = generateSlaReport("tenant_test", [], getSlaConfig("enterprise"));
    const html = generateSlaReportHtml(report);
    expect(html).toContain("No incidents recorded");
  });
});
