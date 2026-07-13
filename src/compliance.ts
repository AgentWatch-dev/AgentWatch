// AgentWatch EU AI Act Compliance Report Generator
// Generates compliance reports from llm_request_logs data.

import { escapeHtml } from "./utils";

export interface ComplianceReportSummary {
  total_requests: number;
  total_sessions: number;
  total_teams: number;
  total_providers: number;
  total_models: number;
  total_tokens: number;
  error_count: number;
  error_rate: number;
  stream_count: number;
  flagged_count: number;
  first_request: string | null;
  last_request: string | null;
}

export interface ComplianceReport {
  tenant_id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  summary: ComplianceReportSummary;
  risk_events: Record<string, number>;
  provider_breakdown: Array<{
    provider: string;
    model: string;
    requests: number;
    tokens: number;
    avg_latency_ms: number;
    errors: number;
  }>;
  daily_volume: Array<{
    day: string;
    requests: number;
    tokens: number;
  }>;
  high_volume_sessions: Array<{
    session_id: string;
    team: string | null;
    model: string;
    max_iteration: number;
    request_count: number;
  }>;
  compliance_status: {
    monitoring_active: boolean;
    data_retention_days: number;
    risk_detection_enabled: boolean;
    budget_enforcement_enabled: boolean;
    pii_screening_enabled: boolean;
  };
}

export interface Soc2Export {
  tenantId: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  controls: Array<{
    control: string;
    category: string;
    status: "implemented" | "not_implemented" | "partial";
    evidence: string;
    lastVerified: string;
  }>;
  accessLogs: Array<{
    id: string;
    timestamp: string;
    action: string;
    ip: string;
    user_agent: string;
    status: number;
  }>;
  authEvents: Array<{
    id: string;
    timestamp: string;
    event_type: string;
    subject: string | null;
    ip: string | null;
    metadata: Record<string, unknown>;
  }>;
  dataRetention: {
    enabled: boolean;
    retentionDays: number;
    policy: string;
  };
  summary: {
    totalAccessLogs: number;
    totalAuthEvents: number;
    uniqueIps: number;
    failedAuthAttempts: number;
    controlsImplemented: number;
    controlsTotal: number;
  };
}

export function generateReportHtml(report: ComplianceReport): string {
  const s = report.summary;
  const riskEntries = Object.entries(report.risk_events);
  const riskRows = riskEntries.length > 0
    ? riskEntries.map(([tag, count]) => `<tr><td>${escapeHtml(tag)}</td><td>${count}</td></tr>`).join("")
    : '<tr><td colspan="2" style="color:#888;">No risk events detected</td></tr>';

  const providerRows = report.provider_breakdown.map(p =>
    `<tr><td>${escapeHtml(p.provider)}</td><td>${escapeHtml(p.model)}</td><td>${p.requests}</td><td>${p.tokens.toLocaleString()}</td><td>${p.avg_latency_ms}ms</td><td>${p.errors}</td></tr>`
  ).join("");

  const sessionRows = report.high_volume_sessions.map(s =>
    `<tr><td>${escapeHtml(s.session_id.slice(0, 16))}</td><td>${escapeHtml(s.team || "-")}</td><td>${escapeHtml(s.model)}</td><td>${s.max_iteration}</td><td>${s.request_count}</td></tr>`
  ).join("");

  const statusBadge = (val: boolean) =>
    val ? '<span style="color:#3FB950;">&#10003; Active</span>' : '<span style="color:#F85149;">&#10007; Inactive</span>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EU AI Act Compliance Report — ${escapeHtml(report.tenant_id)}</title>
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
  .card .value.blue { color: #58A6FF; }
  .card .value.purple { color: #BC8CFF; }
  .card .value.amber { color: #D29922; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 12px; border-bottom: 1px solid #21262D; color: #7D8590; font-weight: 500; font-size: 11px; text-transform: uppercase; }
  td { padding: 8px 12px; border-bottom: 1px solid #161B22; }
  .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; }
  .status-item { display: flex; justify-content: space-between; padding: 8px 12px; background: #161B22; border-radius: 6px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #21262D; color: #484F58; font-size: 12px; }
</style>
</head>
<body>
<h1>EU AI Act Compliance Report</h1>
<div class="subtitle">Tenant: ${escapeHtml(report.tenant_id)} &middot; Period: ${report.period_start.slice(0, 10)} to ${report.period_end.slice(0, 10)} &middot; Generated: ${report.generated_at.slice(0, 19).replace("T", " ")} UTC</div>

<h2>Summary</h2>
<div class="grid">
  <div class="card"><div class="label">Total Requests</div><div class="value blue">${s.total_requests.toLocaleString()}</div></div>
  <div class="card"><div class="label">Total Sessions</div><div class="value purple">${s.total_sessions.toLocaleString()}</div></div>
  <div class="card"><div class="label">Total Tokens</div><div class="value">${s.total_tokens.toLocaleString()}</div></div>
  <div class="card"><div class="label">Error Rate</div><div class="value ${s.error_rate > 5 ? "amber" : "green"}">${s.error_rate}%</div></div>
  <div class="card"><div class="label">Flagged Events</div><div class="value ${s.flagged_count > 0 ? "amber" : "green"}">${s.flagged_count}</div></div>
  <div class="card"><div class="label">Providers Used</div><div class="value">${s.total_providers}</div></div>
</div>

<h2>Compliance Status</h2>
<div class="status-grid">
  <div class="status-item"><span>Monitoring</span>${statusBadge(report.compliance_status.monitoring_active)}</div>
  <div class="status-item"><span>Risk Detection</span>${statusBadge(report.compliance_status.risk_detection_enabled)}</div>
  <div class="status-item"><span>Budget Enforcement</span>${statusBadge(report.compliance_status.budget_enforcement_enabled)}</div>
  <div class="status-item"><span>PII Screening</span>${statusBadge(report.compliance_status.pii_screening_enabled)}</div>
  <div class="status-item"><span>Data Retention</span><span>${report.compliance_status.data_retention_days} days</span></div>
</div>

<h2>Risk Events</h2>
<table>
<thead><tr><th>Risk Tag</th><th>Occurrences</th></tr></thead>
<tbody>${riskRows}</tbody>
</table>

<h2>Provider Breakdown</h2>
<table>
<thead><tr><th>Provider</th><th>Model</th><th>Requests</th><th>Tokens</th><th>Avg Latency</th><th>Errors</th></tr></thead>
<tbody>${providerRows}</tbody>
</table>

<h2>High-Volume Sessions (Potential Anomalies)</h2>
<table>
<thead><tr><th>Session</th><th>Team</th><th>Model</th><th>Max Iteration</th><th>Requests</th></tr></thead>
<tbody>${sessionRows.length > 0 ? sessionRows : '<tr><td colspan="5" style="color:#888;">No high-volume sessions detected</td></tr>'}</tbody>
</table>

<div class="footer">
  <p>AgentWatch EU AI Act Compliance Report &middot; Data sourced from llm_request_logs &middot; Retention: 90 days</p>
  <p>This report is generated automatically. For questions, open an issue on GitHub.</p>
</div>
</body>
</html>`;
}

export function generateSoc2Export(report: Soc2Export): string {
  const controlRows = report.controls.map(c => {
    const statusColor = c.status === "implemented" ? "#3FB950" : c.status === "partial" ? "#D29922" : "#F85149";
    return `<tr>
      <td>${escapeHtml(c.control)}</td>
      <td>${escapeHtml(c.category)}</td>
      <td style="color:${statusColor};">${escapeHtml(c.status)}</td>
      <td>${escapeHtml(c.evidence)}</td>
      <td>${c.lastVerified.slice(0, 10)}</td>
    </tr>`;
  }).join("");

  const accessRows = report.accessLogs.slice(0, 100).map(l => `<tr>
    <td>${l.timestamp.slice(0, 19).replace("T", " ")}</td>
    <td>${escapeHtml(l.action)}</td>
    <td>${escapeHtml(l.ip)}</td>
    <td>${escapeHtml(l.user_agent.slice(0, 40))}</td>
    <td>${l.status}</td>
  </tr>`).join("");

  const controlPct = report.summary.controlsTotal > 0
    ? Math.round((report.summary.controlsImplemented / report.summary.controlsTotal) * 100)
    : 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SOC 2 Type II Evidence Export — ${escapeHtml(report.tenantId)}</title>
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
  .card .value.blue { color: #58A6FF; }
  .card .value.purple { color: #BC8CFF; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 12px; border-bottom: 1px solid #21262D; color: #7D8590; font-weight: 500; font-size: 11px; text-transform: uppercase; }
  td { padding: 8px 12px; border-bottom: 1px solid #161B22; }
  .retention-box { background: #161B22; border: 1px solid #21262D; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #21262D; color: #484F58; font-size: 12px; }
</style>
</head>
<body>
<h1>SOC 2 Type II Evidence Export</h1>
<div class="subtitle">Tenant: ${escapeHtml(report.tenantId)} &middot; Period: ${report.periodStart.slice(0, 10)} to ${report.periodEnd.slice(0, 10)} &middot; Generated: ${report.generatedAt.slice(0, 19).replace("T", " ")} UTC</div>

<h2>Summary</h2>
<div class="grid">
  <div class="card"><div class="label">Controls Implemented</div><div class="value green">${report.summary.controlsImplemented}/${report.summary.controlsTotal} (${controlPct}%)</div></div>
  <div class="card"><div class="label">Access Log Entries</div><div class="value blue">${report.summary.totalAccessLogs.toLocaleString()}</div></div>
  <div class="card"><div class="label">Auth Events</div><div class="value">${report.summary.totalAuthEvents.toLocaleString()}</div></div>
  <div class="card"><div class="label">Unique IPs</div><div class="value purple">${report.summary.uniqueIps.toLocaleString()}</div></div>
  <div class="card"><div class="label">Failed Auth Attempts</div><div class="value" style="color:${report.summary.failedAuthAttempts > 0 ? '#D29922' : '#3FB950'};">${report.summary.failedAuthAttempts}</div></div>
</div>

<h2>CC6.1 Logical Access Controls</h2>
<table>
<thead><tr><th>Control</th><th>Category</th><th>Status</th><th>Evidence</th><th>Last Verified</th></tr></thead>
<tbody>${controlRows}</tbody>
</table>

<h2>API Access Log (Last 100)</h2>
<table>
<thead><tr><th>Timestamp</th><th>Action</th><th>IP</th><th>User Agent</th><th>Status</th></tr></thead>
<tbody>${accessRows.length > 0 ? accessRows : '<tr><td colspan="5" style="color:#888;">No access log entries in period</td></tr>'}</tbody>
</table>

<h2>Data Retention</h2>
<div class="retention-box">
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <div><strong>Data Retention Policy</strong><br><span style="color:#7D8590;">${report.dataRetention.enabled ? "Active" : "Disabled"} &middot; ${report.dataRetention.retentionDays} days &middot; ${escapeHtml(report.dataRetention.policy)}</span></div>
    <span style="color:${report.dataRetention.enabled ? '#3FB950' : '#F85149'};font-size:20px;">${report.dataRetention.enabled ? '&#10003;' : '&#10007;'}</span>
  </div>
</div>

<div class="footer">
  <p>AgentWatch SOC 2 Type II Evidence Export &middot; Data sourced from api_access_log &amp; auth_events</p>
  <p>This report is generated automatically. For questions, open an issue on GitHub.</p>
</div>
</body>
</html>`;
}
