import type { Env } from "./types";
import { calculateCost } from "./pricing";
import { escapeHtml } from "./utils";

export async function handleScheduled(
  event: ScheduledController,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  // Weekly compliance report dispatch (Mondays at 8am UTC via wrangler.toml cron)
  //
  // This cron job:
  // 1. Reads the REPORT_RECIPIENT_MAP to find tenant → email mappings
  // 2. Generates a compliance report for each tenant via the Supabase RPC
  // 3. Sends the report via Resend email
  //
  // If REPORT_RECIPIENT_MAP is not configured or RESEND_API_KEY is missing,
  // this is a no-op — the cron fires but does nothing harmful.

  if (!env.RESEND_API_KEY || !env.SUPABASE_URL) {
    return;
  }

  let recipientMap: Record<string, string> = {};

  // 1. Load static map from wrangler.toml
  try {
    const staticMap = JSON.parse(env.REPORT_RECIPIENT_MAP || "{}");
    Object.assign(recipientMap, staticMap);
  } catch {
    // Ignore static map parsing errors
  }

  // 2. Load dynamic tenants from KV
  try {
    let cursor: string | undefined;
    do {
      const result = await env.KV.list({ prefix: "user_auth:", cursor });
      for (const key of result.keys) {
        // key.name format is "user_auth:email@domain.com"
        const email = key.name.split("user_auth:")[1];
        if (email) {
          const val = await env.KV.get(key.name);
          if (val) {
            try {
              const data = JSON.parse(val);
              if (data.tenantId) {
                recipientMap[data.tenantId] = email;
              }
            } catch {
              // Ignore corrupted JSON in KV
            }
          }
        }
      }
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);
  } catch (err) {
    // If KV is unavailable, we just proceed with the static map
    console.error("Failed to list KV tenants", err);
  }

  const tenantIds = Object.keys(recipientMap);
  if (tenantIds.length === 0) return;

  for (const tenantId of tenantIds) {
    const email = recipientMap[tenantId];
    if (!email) continue;

    try {
      // Generate compliance report via Supabase RPC
      const rpcUrl = `${env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/rpc/generate_compliance_report`;
      const resp = await fetch(rpcUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ tenant_id_param: tenantId, days_back: 7 }),
      });

      if (!resp.ok) continue;

      const report = await resp.json() as Record<string, unknown>;
      const summary = report.summary as Record<string, unknown> | undefined;

      const errRate = Number(summary?.error_rate ?? 0);
      const flagged = Number(summary?.flagged_count ?? 0);
      const totalTokens = Number(summary?.total_tokens ?? 0).toLocaleString();
      const isClean = errRate < 5 && flagged === 0;

      const providerBreakdown = (report.provider_breakdown || []) as { model: string; prompt_tokens: number; completion_tokens: number; }[];
      let totalCostUsd = 0;
      for (const pb of providerBreakdown) {
        totalCostUsd += calculateCost(pb.prompt_tokens, pb.completion_tokens, pb.model);
      }
      const cost = totalCostUsd.toFixed(2);

      const topModels = (report.top_models || []) as { model: string; usage_count: number }[];
      const securityBreakdown = (report.security_breakdown || []) as { risk_type: string; occurrences: number }[];

      const modelsHtml = topModels.length > 0 
        ? topModels.map(m => `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #27272a; color: #f4f4f5; font-size: 14px;">${escapeHtml(m.model)}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #27272a; color: #a1a1aa; font-size: 14px; text-align: right;">${Number(m.usage_count).toLocaleString()}</td>
          </tr>
        `).join('')
        : '<tr><td colspan="2" style="padding: 12px 16px; color: #71717a; font-size: 14px; font-style: italic;">No model usage detected</td></tr>';

      const risksHtml = securityBreakdown.length > 0
        ? securityBreakdown.map(r => `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #27272a; color: #f87171; font-size: 14px; font-weight: 500;">${escapeHtml(r.risk_type)}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #27272a; color: #a1a1aa; font-size: 14px; text-align: right;">${Number(r.occurrences).toLocaleString()}</td>
          </tr>
        `).join('')
        : '<tr><td colspan="2" style="padding: 12px 16px; color: #71717a; font-size: 14px; font-style: italic;">No security risks detected. Excellent.</td></tr>';

      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AgentWatch Telemetry Report</title>
      <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #050505; }
      </style>
      </head>
      <body style="background-color: #050505; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050505; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #0a0a0a; border: 1px solid #1f1f22; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
                <!-- Header Section -->
                <tr>
                  <td align="center" style="padding: 48px 40px 32px; background: linear-gradient(180deg, #111115 0%, #0a0a0a 100%); border-bottom: 1px solid #1f1f22;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="text-align: left;">
                          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Agent<span style="color: #58A6FF;">Watch</span></h1>
                          <p style="margin: 4px 0 0 0; font-size: 13px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">AgentWatch Telemetry Report</p>
                        </td>
                        <td style="text-align: right; vertical-align: top;">
                          <span style="display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${isClean ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${isClean ? '#34d399' : '#f87171'}; border: 1px solid ${isClean ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; text-transform: uppercase; letter-spacing: 1px;">
                            ${isClean ? 'Systems Nominal' : 'Review Suggested'}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body Section -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 32px 0; font-size: 15px; color: #d4d4d8; line-height: 1.6;">
                      Analysis period: <strong style="color: #ffffff;">${String(report.period_start || "").slice(0, 10)}</strong> to <strong style="color: #ffffff;">${String(report.period_end || "").slice(0, 10)}</strong>.
                    </p>

                    <!-- Core Metrics Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: separate;">
                      <tr>
                        <td width="48%" style="background-color: #111115; border: 1px solid #1f1f22; border-radius: 12px; padding: 24px;">
                          <p style="margin: 0; font-size: 13px; color: #a1a1aa; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Total Invocations</p>
                          <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 700; color: #ffffff;">${summary?.total_requests ?? 0}</p>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" style="background-color: #111115; border: 1px solid #1f1f22; border-radius: 12px; padding: 24px;">
                          <p style="margin: 0; font-size: 13px; color: #a1a1aa; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Total Cost</p>
                          <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 700; color: #60a5fa;">$${cost}</p>
                        </td>
                      </tr>
                      <tr><td height="16" colspan="3"></td></tr>
                      <tr>
                        <td width="48%" style="background-color: #111115; border: 1px solid #1f1f22; border-radius: 12px; padding: 24px;">
                          <p style="margin: 0; font-size: 13px; color: #a1a1aa; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Error Rate</p>
                          <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 700; color: ${errRate > 5 ? '#f87171' : '#34d399'};">${errRate}%</p>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" style="background-color: ${flagged > 0 ? '#422006' : '#111115'}; border: 1px solid ${flagged > 0 ? '#713f12' : '#1f1f22'}; border-radius: 12px; padding: 24px;">
                          <p style="margin: 0; font-size: 13px; color: ${flagged > 0 ? '#facc15' : '#a1a1aa'}; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Security Flags</p>
                          <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 700; color: ${flagged > 0 ? '#fef08a' : '#ffffff'};">${flagged}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Deep Dive -->
                    <h2 style="margin: 40px 0 20px 0; font-size: 18px; font-weight: 600; color: #ffffff; letter-spacing: -0.3px;">Deep Dive Analytics</h2>
                    
                    <div style="background-color: #000000; border: 1px solid #1f1f22; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <tr>
                          <th style="padding: 16px; background-color: #050505; border-bottom: 1px solid #1f1f22; color: #71717a; font-size: 12px; font-weight: 700; text-transform: uppercase; text-align: left; letter-spacing: 1px;">Top Models</th>
                          <th style="padding: 16px; background-color: #050505; border-bottom: 1px solid #1f1f22; color: #71717a; font-size: 12px; font-weight: 700; text-transform: uppercase; text-align: right; letter-spacing: 1px;">Usage</th>
                        </tr>
                        ${modelsHtml}
                      </table>
                    </div>

                    <div style="background-color: #000000; border: 1px solid #1f1f22; border-radius: 12px; overflow: hidden; margin-bottom: 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <tr>
                          <th style="padding: 16px; background-color: #050505; border-bottom: 1px solid #1f1f22; color: #71717a; font-size: 12px; font-weight: 700; text-transform: uppercase; text-align: left; letter-spacing: 1px;">Risk Classification</th>
                          <th style="padding: 16px; background-color: #050505; border-bottom: 1px solid #1f1f22; color: #71717a; font-size: 12px; font-weight: 700; text-transform: uppercase; text-align: right; letter-spacing: 1px;">Occurrences</th>
                        </tr>
                        ${risksHtml}
                      </table>
                    </div>

                    <!-- Action Button -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <a href="${(env.SITE_URL || 'http://localhost:8787')}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4); border: 1px solid #3b82f6;">Open Dashboard</a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 32px 40px; background-color: #050505; border-top: 1px solid #1f1f22;">
                    <p style="margin: 0; color: #52525b; font-size: 12px; line-height: 1.6;">
                      Automated intelligence report generated by AgentWatch telemetry.<br>
                      Tenant ID: ${tenantId}<br><br>
                      Confidential & Proprietary. Do not distribute without authorization.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.REPORT_FROM_EMAIL || "AgentWatch <noreply@localhost>",
          to: [email],
          subject: `AgentWatch Weekly Compliance Report — ${tenantId}`,
          html,
        }),
      }).catch(() => {});
    } catch {
      // Best-effort: continue to next tenant
    }
  }

}
