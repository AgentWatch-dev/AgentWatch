# Changelog

## v1.1.0 — Feature Parity Release

**Date:** July 2026

### Added

- **Cost Estimation Endpoints**
  - `POST /v1/estimate-cost` — Stateless cost prediction for a single LLM call (no auth required)
  - `POST /v1/cost/estimate` — Multi-step workflow cost estimation with authentication

- **Agent-Level Budgets**
  - `GET /v1/teams/agent-budgets` — List per-agent budget allocations
  - `POST /v1/teams/agent-budgets` — Create/update agent budget with monthly USD limit, alert threshold, and hard stop toggle
  - `DELETE /v1/teams/agent-budgets/:team/:agent` — Remove agent budget

- **Governance Enhancements**
  - Custom anomaly rules engine with configurable conditions and actions (`allow`, `block`, `throttle`, `alert`, `tag`)
  - Governance modes: `observe`, `soft`, `hard`
  - PII blocking toggle (`block_on_pii`)
  - Loop detection with configurable actions

- **Data Residency**
  - `GET /v1/residency` / `POST /v1/residency` — Region-based data routing (`global`, `eu`, `us`, `apac`)
  - Per-request residency override via `x-agentwatch-residency` header

- **SSO / SAML Integration**
  - `GET /v1/sso/saml/init` — IdP-initiated SSO flow
  - `POST /v1/sso/saml/acs` — Assertion consumer with replay protection
  - SSO status endpoint for configuration verification

- **SOC 2 Compliance**
  - `GET /v1/dashboard/compliance/soc2` — Automated SOC 2 evidence export
  - Control mapping for CC6.1, CC6.2, CC6.3, CC6.6, CC7.2

- **SLA Monitoring**
  - `GET /v1/dashboard/sla` — Uptime and latency SLA reports with plan-specific thresholds

- **Advanced Analytics**
  - `GET /v1/dashboard/analytics/advanced` — Cost-by-model, latency-by-provider, traffic breakdown
  - `GET /v1/dashboard/analytics/volume` — Hourly request volume

- **Enhanced Dashboard**
  - Per-agent spend breakdown (`/v1/dashboard/agent-spend`)
  - Governance timeline per session (`/v1/dashboard/timeline`)
  - Audit log viewer (`/v1/dashboard/audit_logs`)
  - API key management with role-based access and team assignment
  - Team management (create/delete teams)

- **Security Hardening**
  - Request header stripping before upstream forwarding (prevents header injection)
  - Constant-time token comparison (timing-safe auth)
  - SSRF protection for Bedrock region validation
  - Session ID sanitization (alphanumeric + limited special chars)
  - Global kill switch for instant key revocation

- **Semantic Caching**
  - KV-based response caching with SHA-256 keys
  - Cache status headers (`x-agentwatch-cache-status: HIT/MISS`)
  - Configurable per-tenant via settings

- **Streaming Budget Enforcement**
  - Real-time token counting during SSE streams
  - Mid-stream termination when session budget is exceeded
  - Fail-open/fail-closed policy support

### Changed

- Upgraded to Node 20.12+ requirement (rolldown compatibility)
- Improved error response consistency across all endpoints

### Fixed

- CI matrix updated to drop Node 18 (rolldown requires Node 20.12+)

---

## v1.0.1 — Initial Open-Source Release

**Date:** June 2026

### Features

- **LLM Proxy** — Transparent proxy for OpenAI, Anthropic, Groq, xAI, Gemini, Xiaomi, Mistral, Cohere, Azure, and AWS Bedrock
- **BYOK Authentication** — Bring Your Own Key pattern with `aw_token:provider_key` format
- **Tenant Isolation** — Per-tenant token mapping with KV-backed lookup
- **Usage Logging** — Request/response logging to Supabase with token counting
- **Dashboard** — Real-time monitoring UI with summary, provider breakdown, and team spend
- **Team Budgets** — Monthly USD budgets per team with alert thresholds and hard stops
- **Session Tracking** — Per-session token aggregation via Durable Objects
- **Runaway Agent Detection** — Quadratic growth pattern detection in session tokens
- **Risk Classification** — PII, financial data, and secret detection in request payloads
- **Slack Notifications** — Webhook-based alerting for budget thresholds and anomalies
- **Rate Limiting** — Cloudflare Rate Limiter integration per tenant/team
- **CORS Support** — Configurable allowed origins
- **Fallback Policies** — `fail_open` and `fail_closed` modes for upstream errors
