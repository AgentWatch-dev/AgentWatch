import { escapeHtml } from "./utils";

export function getContactEmailHtml(name: string, email: string, company: string, spend: string, plan: string): string {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Access Request</title>
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
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0a0a0a; border: 1px solid #1f1f22; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
                <tr>
                  <td align="center" style="padding: 48px 40px 32px; background: linear-gradient(180deg, #111115 0%, #0a0a0a 100%); border-bottom: 1px solid #1f1f22;">
                    <span style="display: inline-block; background: rgba(59, 130, 246, 0.1); color: #60a5fa; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border: 1px solid rgba(59, 130, 246, 0.2);">Hot Lead</span>
                    <h1 style="margin: 16px 0 0 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">New Access Request</h1>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding: 40px;">
                    <!-- Contact Details Group -->
                    <h3 style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; border-bottom: 1px solid #1f1f22; padding-bottom: 8px; margin: 0 0 20px 0;">Contact Information</h3>
                    <div style="margin-bottom: 32px;">
                      <div style="margin-bottom: 16px;">
                        <span style="display: block; color: #a1a1aa; font-size: 13px; margin-bottom: 4px;">Full Name</span>
                        <strong style="color: #e4e4e7; font-size: 18px;">${escapeHtml(name)}</strong>
                      </div>
                      <div>
                        <span style="display: block; color: #a1a1aa; font-size: 13px; margin-bottom: 4px;">Work Email</span>
                        <a href="mailto:${escapeHtml(email)}" style="color: #60a5fa; font-size: 16px; text-decoration: none; font-weight: 600;">${escapeHtml(email)}</a>
                      </div>
                    </div>

                    <!-- Company Details Group -->
                    <h3 style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; border-bottom: 1px solid #1f1f22; padding-bottom: 8px; margin: 0 0 20px 0;">Company Profile</h3>
                    <div>
                      <div style="margin-bottom: 16px;">
                        <span style="display: block; color: #a1a1aa; font-size: 13px; margin-bottom: 4px;">Organization</span>
                        <strong style="color: #e4e4e7; font-size: 18px;">${escapeHtml(company)}</strong>
                      </div>
                      <div style="background-color: #052e16; border: 1px solid #064e3b; border-radius: 8px; padding: 16px; margin-top: 20px;">
                        <span style="display: block; color: #34d399; font-size: 13px; margin-bottom: 4px;">Total Monthly AI Spend</span>
                        <strong style="color: #6ee7b7; font-size: 24px;">${escapeHtml(spend || "Not specified")}</strong>
                      </div>
                      <div style="background-color: #1e1b4b; border: 1px solid #3730a3; border-radius: 8px; padding: 16px; margin-top: 12px;">
                        <span style="display: block; color: #a78bfa; font-size: 13px; margin-bottom: 4px;">Selected Plan</span>
                        <strong style="color: #c4b5fd; font-size: 20px;">${escapeHtml(plan === "free" ? "Free Tier" : plan === "pro" ? "Pro Plan ($99/mo)" : plan === "enterprise" ? "Enterprise (Custom)" : plan)}</strong>
                      </div>
                    </div>
                    
                    <!-- Action Button -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 40px;">
                      <tr>
                        <td align="center">
                          <a href="mailto:${escapeHtml(email)}?subject=Re: AgentWatch Inquiry" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4); border: 1px solid #3b82f6;">Reply to Prospect</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 32px 40px; background-color: #050505; border-top: 1px solid #1f1f22;">
                    <p style="color: #52525b; font-size: 12px; margin: 0; text-align: center;">Captured directly from the AgentWatch Edge Network</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;
}

export function getProvisionEmailHtml(token: string, siteUrl: string): string {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to AgentWatch</title>
      <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #050505; }
      </style>
      </head>
      <body style="background-color: #050505; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050505; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0a0a0a; border: 1px solid #1f1f22; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
                <tr>
                  <td align="center" style="padding: 48px 40px 32px; background: linear-gradient(180deg, #111115 0%, #0a0a0a 100%); border-bottom: 1px solid #1f1f22;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff; display: flex; align-items: center; justify-content: center; gap: 8px;">
                      AgentWatch
                    </h1>
                    <p style="margin: 16px 0 0 0; font-size: 16px; line-height: 1.5; color: #a1a1aa; font-weight: 400;">
                      The expense policy for your AI agents.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding: 40px;">
                    <h2 style="margin: 0 0 24px; font-size: 20px; font-weight: 600; color: #f4f4f5; letter-spacing: -0.5px;">AgentWatch blocks runaway LLM agents before they burn your budget. Not after.</h2>
                    <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #a1a1aa;">
                      Your workspace is now fully provisioned. You have successfully activated automated protection against runaway agent spend. Works in 2 lines of code.
                    </p>
                    <div style="background: #111115; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                      <p style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; color: #71717a;">Production API Key</p>
                      <div style="background: #000000; border: 1px solid #3f3f46; border-radius: 8px; padding: 16px; margin: 0;">
                        <code style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px; color: #60a5fa; word-break: break-all;">${token}</code>
                      </div>
                      <p style="margin: 12px 0 0; font-size: 13px; color: #71717a;">Keep this key highly secure. Do not commit it to version control.</p>
                    </div>
                    <h3 style="margin: 0 0 20px; font-size: 16px; font-weight: 600; color: #e4e4e7; letter-spacing: -0.3px;">Quick Start Integration</h3>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #09090b; border: 1px solid #1f1f22; border-radius: 12px;">
                      <tr>
                        <td style="padding: 24px;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td valign="top" style="width: 28px; color: #8b5cf6; font-weight: 600; font-size: 15px;">1.</td>
                              <td style="padding-bottom: 20px; font-size: 15px; color: #a1a1aa; line-height: 1.5;">
                                <strong style="color: #d4d4d8;">Configure your API Key (BYOK)</strong><br>
                                Combine your AgentWatch key with your real OpenAI/Anthropic key using a colon.<br>
                                <code style="display: inline-block; background: #18181b; padding: 4px 8px; border-radius: 6px; margin-top: 8px; border: 1px solid #27272a; font-size: 13px; color: #e4e4e7;">export OPENAI_API_KEY="aw_live_...:sk-proj-..."</code>
                              </td>
                            </tr>
                            <tr>
                              <td valign="top" style="width: 28px; color: #8b5cf6; font-weight: 600; font-size: 15px;">2.</td>
                              <td style="padding-bottom: 20px; font-size: 15px; color: #a1a1aa; line-height: 1.5;">
                                <strong style="color: #d4d4d8;">Route Traffic to the Proxy</strong><br>
                                Point your SDK or CLI tool's base URL to the AgentWatch edge.<br>
                                <code style="display: inline-block; background: #18181b; padding: 4px 8px; border-radius: 6px; margin-top: 8px; border: 1px solid #27272a; font-size: 13px; color: #e4e4e7;">export OPENAI_BASE_URL="${siteUrl}/v1/proxy/openai"</code>
                              </td>
                            </tr>
                            <tr>
                              <td valign="top" style="width: 28px; color: #8b5cf6; font-weight: 600; font-size: 15px;">3.</td>
                              <td style="font-size: 15px; color: #a1a1aa; line-height: 1.5;">
                                <strong style="color: #d4d4d8;">Run Your AI Tools</strong><br>
                                Execute your agents (Cursor, Claude Code, etc.). All telemetry and budgets are instantly tracked, while your real API key is securely forwarded upstream.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 32px 40px; background-color: #050505; border-top: 1px solid #1f1f22;">
                    <p style="margin: 0; font-size: 13px; color: #52525b; line-height: 1.6;">
                      AgentWatch Inc.<br>
                      Securing the future of AI infrastructure.
                    </p>
                    <p style="margin: 12px 0 0; font-size: 13px; color: #52525b;">
                      Need architectural support? Reply directly to this email to reach our engineering team.
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
}

export function buildWelcomeEmail(apiKey: string, siteUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color:#050505;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#050505;padding:40px 20px;">
<tr><td align="center">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#0a0a0a;border:1px solid #1f1f22;border-radius:16px;overflow:hidden;">
<tr><td align="center" style="padding:48px 40px 32px;background:linear-gradient(180deg,#111115 0%,#0a0a0a 100%);border-bottom:1px solid #1f1f22;">
<h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">AgentWatch</h1>
<p style="margin:16px 0 0;font-size:16px;color:#a1a1aa;">The expense policy for your AI agents.</p>
</td></tr>
<tr><td align="left" style="padding:40px;">
<h2 style="margin:0 0 24px;font-size:20px;font-weight:600;color:#f4f4f5;">Welcome aboard. Your agents are now protected.</h2>
<p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#a1a1aa;">You have 50K free tokens. Here's your API key — combine it with your OpenAI or Anthropic key to get started.</p>
<div style="background:#111115;border:1px solid #27272a;border-radius:12px;padding:24px;margin-bottom:32px;">
<p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;color:#71717a;">Your API Key</p>
<div style="background:#000000;border:1px solid #3f3f46;border-radius:8px;padding:16px;">
<code style="font-family:ui-monospace,monospace;font-size:15px;color:#60a5fa;word-break:break-all;">${apiKey}</code>
</div>
<p style="margin:12px 0 0;font-size:13px;color:#71717a;">Keep this key secure. Do not commit it to version control.</p>
</div>
<h3 style="margin:0 0 20px;font-size:16px;font-weight:600;color:#e4e4e7;">Quick Start (2 minutes)</h3>
<p style="margin:0 0 16px;font-size:15px;color:#a1a1aa;line-height:1.6;">
<strong style="color:#d4d4d8;">1.</strong> Combine your keys: <code style="background:#18181b;padding:4px 8px;border-radius:6px;border:1px solid #27272a;font-size:13px;color:#e4e4e7;">aw_live_...:sk-proj-...</code><br>
<strong style="color:#d4d4d8;">2.</strong> Change your base URL to <code style="background:#18181b;padding:4px 8px;border-radius:6px;border:1px solid #27272a;font-size:13px;color:#e4e4e7;">${siteUrl || "http://localhost:8787"}/v1/proxy/openai</code><br>
<strong style="color:#d4d4d8;">3.</strong> Ship with confidence. Your budget is enforced.
</p>
<a href="${siteUrl || "http://localhost:8787"}/v1/dashboard" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">Open Dashboard →</a>
</td></tr>
<tr><td style="padding:0 40px 40px;">
<p style="margin:0;font-size:13px;color:#52525b;">Questions? Reply to this email — we read every one.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}
