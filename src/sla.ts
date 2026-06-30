// AgentWatch SLA Monitoring Module
// Tracks uptime, detects breaches, and generates SLA reports.

import { escapeHtml } from "./utils";

export interface SlaConfig {
  targetUptime: number;
  windowDays: number;
  maxDowntimeMinutes: number;
}

export interface UptimeRecord {
  timestamp: string;
  status: "up" | "down" | "degraded";
  latencyMs: number;
  statusCode: number | null;
  error: string | null;
}

export interface SlaIncident {
  start: string;
  end: string;
  durationMinutes: number;
  cause: string;
  statusCode: number | null;
}

export interface LatencyMetrics {
  avgMs: number;
  p50Ms: number;
  p99Ms: number;
  maxMs: number;
}

export interface SlaReport {
  tenantId: string;
  generatedAt: string;
  windowDays: number;
  targetUptime: number;
  actualUptime: number;
  uptimeMet: boolean;
  totalChecks: number;
  upChecks: number;
  downChecks: number;
  degradedChecks: number;
  maxDowntimeMinutes: number;
  actualDowntimeMinutes: number;
  downtimeWithinBudget: boolean;
  incidents: SlaIncident[];
  latency: LatencyMetrics;
}

const PLAN_SLA: Record<string, SlaConfig> = {
  enterprise: { targetUptime: 99.9, windowDays: 30, maxDowntimeMinutes: 43.2 },
  pro: { targetUptime: 99.5, windowDays: 30, maxDowntimeMinutes: 216 },
  free: { targetUptime: 99.0, windowDays: 30, maxDowntimeMinutes: 432 },
};

export function getSlaConfig(plan: string): SlaConfig {
  return PLAN_SLA[plan] || PLAN_SLA.free;
}

export function calculateUptime(records: UptimeRecord[]): { uptimePct: number; latency: LatencyMetrics; totalChecks: number; upChecks: number; downChecks: number; degradedChecks: number } {
  const totalChecks = records.length;
  if (totalChecks === 0) {
    return { uptimePct: 100, latency: { avgMs: 0, p50Ms: 0, p99Ms: 0, maxMs: 0 }, totalChecks: 0, upChecks: 0, downChecks: 0, degradedChecks: 0 };
  }

  const upChecks = records.filter(r => r.status === "up").length;
  const downChecks = records.filter(r => r.status === "down").length;
  const degradedChecks = records.filter(r => r.status === "degraded").length;

  const uptimePct = (upChecks / totalChecks) * 100;

  const latencies = records.map(r => r.latencyMs).sort((a, b) => a - b);
  const sum = latencies.reduce((s, l) => s + l, 0);
  const avgMs = sum / latencies.length;
  const p50Index = Math.max(0, Math.floor(latencies.length * 0.5));
  const p50Ms = latencies[p50Index] || 0;
  const p99Index = Math.max(0, Math.ceil(latencies.length * 0.99) - 1);
  const p99Ms = latencies[p99Index] || 0;
  const maxMs = latencies[latencies.length - 1] || 0;

  return { uptimePct, latency: { avgMs, p50Ms, p99Ms, maxMs }, totalChecks, upChecks, downChecks, degradedChecks };
}

export function detectIncidents(records: UptimeRecord[]): SlaIncident[] {
  const incidents: SlaIncident[] = [];
  let incidentStart: UptimeRecord | null = null;

  for (const record of records) {
    if (record.status !== "up") {
      if (!incidentStart) {
        incidentStart = record;
      }
    } else {
      if (incidentStart) {
        const startMs = new Date(incidentStart.timestamp).getTime();
        const endMs = new Date(record.timestamp).getTime();
        const durationMinutes = (endMs - startMs) / 60000;

        incidents.push({
          start: incidentStart.timestamp,
          end: record.timestamp,
          durationMinutes,
          cause: incidentStart.error || `Status: ${incidentStart.status}`,
          statusCode: incidentStart.statusCode,
        });
        incidentStart = null;
      }
    }
  }

  if (incidentStart) {
    const startMs = new Date(incidentStart.timestamp).getTime();
    const endMs = records.length > 0 ? new Date(records[records.length - 1].timestamp).getTime() : startMs;
    const durationMinutes = (endMs - startMs) / 60000;

    incidents.push({
      start: incidentStart.timestamp,
      end: new Date(endMs).toISOString(),
      durationMinutes,
      cause: incidentStart.error || `Status: ${incidentStart.status}`,
      statusCode: incidentStart.statusCode,
    });
  }

  return incidents;
}

export function generateSlaReport(tenantId: string, records: UptimeRecord[], config: SlaConfig): SlaReport {
  const { uptimePct, latency, totalChecks, upChecks, downChecks, degradedChecks } = calculateUptime(records);
  const incidents = detectIncidents(records);

  const actualDowntimeMinutes = incidents.reduce((sum, inc) => sum + inc.durationMinutes, 0);

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    windowDays: config.windowDays,
    targetUptime: config.targetUptime,
    actualUptime: uptimePct,
    uptimeMet: uptimePct >= config.targetUptime,
    totalChecks,
    upChecks,
    downChecks,
    degradedChecks,
    maxDowntimeMinutes: config.maxDowntimeMinutes,
    actualDowntimeMinutes,
    downtimeWithinBudget: actualDowntimeMinutes <= config.maxDowntimeMinutes,
    incidents,
    latency,
  };
}

export function generateSlaReportHtml(report: SlaReport): string {
  const incidentRows = report.incidents.length > 0
    ? report.incidents.map(inc =>
      `<tr><td>${inc.start.slice(0, 19).replace("T", " ")}</td><td>${inc.end.slice(0, 19).replace("T", " ")}</td><td>${inc.durationMinutes.toFixed(1)} min</td><td>${escapeHtml(inc.cause)}</td></tr>`
    ).join("")
    : '<tr><td colspan="4" style="color:#7D8590;">No incidents recorded</td></tr>';

  const uptimeColor = report.uptimeMet ? "#3FB950" : "#F85149";
  const downtimeColor = report.downtimeWithinBudget ? "#3FB950" : "#F85149";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SLA Report — ${escapeHtml(report.tenantId)}</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0D1117; color: #E6EDF3; padding: 40px; line-height: 1.6; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  h2 { font-size: 18px; margin: 32px 0 12px; color: #58A6FF; border-bottom: 1px solid #21262D; padding-bottom: 8px; }
  .subtitle { color: #7D8590; font-size: 14px; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .card { background: #161B22; border: 1px solid #21262D; border-radius: 8px; padding: 16px; }
  .card .label { font-size: 11px; text-transform: uppercase; color: #7D8590; letter-spacing: 0.05em; }
  .card .value { font-size: 24px; font-weight: 700; margin-top: 4px; }
  .card .value.green { color: #3FB950; }
  .card .value.red { color: #F85149; }
  .card .value.blue { color: #58A6FF; }
  .card .value.purple { color: #BC8CFF; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 12px; border-bottom: 1px solid #21262D; color: #7D8590; font-weight: 500; font-size: 11px; text-transform: uppercase; }
  td { padding: 8px 12px; border-bottom: 1px solid #161B22; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #21262D; color: #484F58; font-size: 12px; }
</style>
</head>
<body>
<h1>SLA Monitoring Report</h1>
<div class="subtitle">Tenant: ${escapeHtml(report.tenantId)} &middot; Window: ${report.windowDays} days &middot; Generated: ${report.generatedAt.slice(0, 19).replace("T", " ")} UTC</div>

<h2>SLA Status</h2>
<div class="grid">
  <div class="card"><div class="label">Target Uptime</div><div class="value blue">${report.targetUptime}%</div></div>
  <div class="card"><div class="label">Actual Uptime</div><div class="value" style="color:${uptimeColor}">${report.actualUptime.toFixed(3)}%</div></div>
  <div class="card"><div class="label">SLA Met</div><div class="value" style="color:${uptimeColor}">${report.uptimeMet ? "Yes" : "No"}</div></div>
  <div class="card"><div class="label">Total Checks</div><div class="value">${report.totalChecks.toLocaleString()}</div></div>
  <div class="card"><div class="label">Down Checks</div><div class="value" style="color:${report.downChecks > 0 ? "#F85149" : "#3FB950"}">${report.downChecks}</div></div>
  <div class="card"><div class="label">Degraded Checks</div><div class="value" style="color:${report.degradedChecks > 0 ? "#D29922" : "#3FB950"}">${report.degradedChecks}</div></div>
</div>

<h2>Downtime Budget</h2>
<div class="grid">
  <div class="card"><div class="label">Max Allowed Downtime</div><div class="value">${report.maxDowntimeMinutes.toFixed(1)} min</div></div>
  <div class="card"><div class="label">Actual Downtime</div><div class="value" style="color:${downtimeColor}">${report.actualDowntimeMinutes.toFixed(1)} min</div></div>
  <div class="card"><div class="label">Budget Status</div><div class="value" style="color:${downtimeColor}">${report.downtimeWithinBudget ? "Within Budget" : "Exceeded"}</div></div>
</div>

<h2>Latency Metrics</h2>
<div class="grid">
  <div class="card"><div class="label">Average Latency</div><div class="value purple">${report.latency.avgMs.toFixed(0)}ms</div></div>
  <div class="card"><div class="label">P99 Latency</div><div class="value purple">${report.latency.p99Ms.toFixed(0)}ms</div></div>
  <div class="card"><div class="label">Max Latency</div><div class="value purple">${report.latency.maxMs.toFixed(0)}ms</div></div>
</div>

<h2>Incidents</h2>
<table>
<thead><tr><th>Start</th><th>End</th><th>Duration</th><th>Cause</th></tr></thead>
<tbody>${incidentRows}</tbody>
</table>

<div class="footer">
  <p>AgentWatch SLA Monitoring Report &middot; Data from uptime checks</p>
</div>
</body>
</html>`;
}
