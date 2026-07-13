# API Reference

Base URL: `https://your-domain.workers.dev`

All endpoints accept and return JSON unless otherwise noted. Responses include standard CORS and security headers.

## Authentication

AgentWatch uses a **Bring Your Own Key (BYOK)** pattern. Every authenticated request requires a Bearer token in the `Authorization` header:

```
Authorization: Bearer aw_live_<your_key>:<your_provider_api_key>
```

The token format is `aw_token:real_key` where:
- `aw_live_<hex>` — Your AgentWatch tenant token (issued at signup)
- `:` — Separator
- `<provider_api_key>` — Your actual LLM provider API key (e.g., `sk-...` for OpenAI)

For dashboard and management endpoints, only the AgentWatch token portion is required (no provider key needed).

### Rate Limiting

Rate limiting is enforced per tenant and team via Cloudflare Rate Limiting. Exceeding the limit returns `429`.

### Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "message": "Error description",
    "type": "agentwatch_proxy_error"
  }
}
```

---

## Proxy Endpoints

### `POST /v1/proxy/:provider/*`

Main proxy endpoint. Routes requests to the specified LLM provider, applying governance policies (budget enforcement, anomaly detection, custom rules) before forwarding.

**Supported providers:** `openai`, `anthropic`, `groq`, `xai`, `gemini`, `azure`, `bedrock`, `xiaomi`, `mistral`, `cohere`

| Parameter | Required | Description |
|-----------|----------|-------------|
| `provider` | Yes | LLM provider name (path segment) |
| `*` | No | Remaining path forwarded to provider (defaults to `chat/completions`) |

**Authentication:** Required (BYOK format)

**Request Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer aw_token:provider_key` |
| `x-agentwatch-session-id` | No | Session ID for budget tracking |
| `x-agentwatch-budget-usd` | No | Per-session USD budget limit |
| `x-agentwatch-team` | No | Team name for budget routing |
| `x-agentwatch-cache` | No | `"true"` to enable request caching |
| `x-agentwatch-residency` | No | Data residency region: `global`, `eu`, `us`, `apac` |
| `Content-Type` | Yes | `application/json` |

**Request Body:** Provider-specific (e.g., OpenAI chat completions format)

**Response:** Proxied response from the upstream provider (JSON or SSE stream)

**Status Codes:**

| Code | Description |
|------|-------------|
| `200` | Success |
| `401` | Missing or invalid token |
| `402` | Insufficient credits or budget exceeded |
| `429` | Rate limit or monthly request limit exceeded |
| `500` | Configuration error |
| `502` | Upstream provider request failed |

**curl Example:**

```bash
curl -X POST https://your-domain.workers.dev/v1/proxy/openai/chat/completions \
  -H "Authorization: Bearer aw_live_abc123def456:sk-your-openai-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

## Dashboard Endpoints

### `GET /v1/dashboard`

Returns the dashboard HTML page.

**Authentication:** None (web page)

### `GET /v1/dashboard/summary`

Returns aggregated dashboard summary data including total requests, tokens, costs, and balance.

**Authentication:** Required (AgentWatch token)

| Query Param | Default | Description |
|-------------|---------|-------------|
| `days` | `30` | Lookback period in days |

**Response:**

```json
{
  "tenant_balance": 0.05,
  "total_requests": 1234,
  "total_prompt_tokens": 500000,
  "total_completion_tokens": 200000
}
```

**curl Example:**

```bash
curl https://your-domain.workers.dev/v1/dashboard/summary?days=7 \
  -H "Authorization: Bearer aw_live_abc123def456"
```

### `GET /v1/dashboard/analytics/advanced`

Returns advanced analytics including cost-by-model, latency-by-provider, and traffic breakdown. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

| Query Param | Default | Description |
|-------------|---------|-------------|
| `days` | `14` | Lookback period in days |

### `GET /v1/dashboard/sessions`

Returns session-level analytics.

**Authentication:** Required (AgentWatch token)

| Query Param | Default | Description |
|-------------|---------|-------------|
| `days` | `7` | Lookback period in days |

### `GET /v1/dashboard/anomalies`

Returns detected anomalies. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

| Query Param | Default | Description |
|-------------|---------|-------------|
| `days` | `7` | Lookback period in days |

### `GET /v1/dashboard/spend-trend`

Returns spend trend data over time.

**Authentication:** Required (AgentWatch token)

### `GET /v1/dashboard/providers`

Returns provider-level breakdown.

**Authentication:** Required (AgentWatch token)

| Query Param | Default | Description |
|-------------|---------|-------------|
| `days` | `30` | Lookback period in days |

### `GET /v1/dashboard/teams`

Returns team-level spend breakdown.

**Authentication:** Required (AgentWatch token)

| Query Param | Default | Description |
|-------------|---------|-------------|
| `days` | `30` | Lookback period in days |

### `GET /v1/dashboard/agent-spend`

Returns per-agent spend breakdown from audit logs.

**Authentication:** Required (AgentWatch token)

| Query Param | Default | Description |
|-------------|---------|-------------|
| `days` | `7` | Lookback period in days |

**Response:**

```json
[
  {
    "agent": "code-reviewer",
    "tokens": 12500,
    "cost": 0.0312,
    "requests": 42
  }
]
```

### `GET /v1/dashboard/manage-teams`

Returns list of teams.

**Authentication:** Required (AgentWatch token)

### `POST /v1/dashboard/manage-teams`

Creates a new team.

**Authentication:** Required (AgentWatch token)

**Request Body:**

```json
{
  "name": "engineering"
}
```

### `DELETE /v1/dashboard/manage-teams/:team`

Deletes a team.

**Authentication:** Required (AgentWatch token)

### `GET /v1/dashboard/keys`

Returns API keys. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

### `POST /v1/dashboard/keys`

Creates a new API key. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

**Request Body:**

```json
{
  "name": "CI Pipeline Key",
  "role": "developer",
  "team_id": "team_engineering"
}
```

**Response:**

```json
{
  "token": "aw_live_...",
  "name": "CI Pipeline Key",
  "role": "developer"
}
```

### `DELETE /v1/dashboard/keys`

Revokes an API key by prefix.

**Authentication:** Required (AgentWatch token)

**Request Body:**

```json
{
  "key_prefix": "aw_live_abc123..."
}
```

### `DELETE /v1/dashboard/keys/:keyId`

Revokes an API key by ID.

**Authentication:** Required (AgentWatch token)

### `GET /v1/dashboard/audit_logs`

Returns audit log entries. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

### `GET /v1/dashboard/timeline`

Returns governance timeline events for a specific session.

**Authentication:** Required (AgentWatch token)

| Query Param | Required | Description |
|-------------|----------|-------------|
| `session_id` | Yes | Session ID to query |

### `GET /v1/dashboard/settings/slack`

Returns Slack webhook configuration.

**Authentication:** Required (AgentWatch token)

### `POST /v1/dashboard/settings/slack`

Sets or clears Slack webhook URL. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

**Request Body:**

```json
{
  "webhookUrl": "https://hooks.slack.com/services/T00/B00/xxx"
}
```

### `GET /v1/dashboard/settings`

Returns all tenant settings.

**Authentication:** Required (AgentWatch token)

**Response:**

```json
{
  "webhookUrl": "https://hooks.slack.com/...",
  "alertEmail": "admin@company.com",
  "alertThreshold": 80,
  "dataRetention": 30,
  "fallbackPolicy": "fail_open",
  "cacheEnabled": false,
  "governance_mode": "soft",
  "block_on_pii": false,
  "loop_detection_action": "block"
}
```

### `POST /v1/dashboard/settings`

Updates tenant settings.

**Authentication:** Required (AgentWatch token)

**Request Body:**

```json
{
  "alertEmail": "admin@company.com",
  "alertThreshold": 80,
  "dataRetention": 30,
  "fallbackPolicy": "fail_closed",
  "cacheEnabled": true,
  "governance_mode": "hard",
  "block_on_pii": true,
  "loop_detection_action": "block"
}
```

### `POST /v1/dashboard/settings/export`

Exports logs as CSV.

**Authentication:** Required (AgentWatch token)

**Response:** CSV file with `Content-Disposition: attachment`

### `POST /v1/dashboard/settings/reset`

Resets workspace data.

**Authentication:** Required (AgentWatch token)

### `POST /v1/dashboard/settings/delete`

Deletes workspace and all associated data. **Irreversible.**

**Authentication:** Required (AgentWatch token)

### `GET /v1/dashboard/sla`

Returns SLA monitoring report. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

| Query Param | Default | Description |
|-------------|---------|-------------|
| `days` | `30` | Lookback period |
| `format` | `json` | Response format: `json` or `html` |

### `GET /v1/dashboard/analytics/volume`

Returns request volume by hour (last 24 hours).

**Authentication:** Required (AgentWatch token)

### `GET /v1/dashboard/plan`

Returns current plan details and usage.

**Authentication:** Required (AgentWatch token)

**Response:**

```json
{
  "plan": "free",
  "requestCount": 1234,
  "requestLimit": 50000,
  "requestsRemaining": 48766
}
```

### `GET /v1/dashboard/sso-status`

Returns SSO configuration status. **Enterprise only.**

**Authentication:** Required (AgentWatch token, Enterprise plan)

### `GET /v1/dashboard/compliance/soc2`

Generates SOC 2 compliance evidence export as HTML. **Enterprise only.**

**Authentication:** Required (AgentWatch token, Enterprise plan)

---

## Team & Budget Endpoints

### `GET /v1/teams/budgets`

Returns all team budgets and their current spend status. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

### `GET /v1/teams/budget-check`

Checks monthly spend for a specific team. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

| Query Param | Required | Description |
|-------------|----------|-------------|
| `team` | Yes | Team name |

### `POST /v1/teams/budgets`

Creates or updates a team budget. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

**Request Body:**

```json
{
  "team": "engineering",
  "monthly_budget_usd": 500.00,
  "alert_threshold_pct": 80,
  "hard_stop": true
}
```

### `GET /v1/teams/agent-budgets`

Returns all agent budgets. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

### `POST /v1/teams/agent-budgets`

Creates or updates an agent budget. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

**Request Body:**

```json
{
  "team": "engineering",
  "agent_name": "code-reviewer",
  "monthly_budget_usd": 100.00,
  "alert_threshold_pct": 80,
  "hard_stop": false
}
```

**Response:**

```json
{
  "success": true,
  "budget": { ... }
}
```

### `DELETE /v1/teams/agent-budgets/:team/:agent`

Deletes an agent budget. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

**curl Example:**

```bash
curl -X DELETE https://your-domain.workers.dev/v1/teams/agent-budgets/engineering/code-reviewer \
  -H "Authorization: Bearer aw_live_abc123def456"
```

---

## Rules & Governance

### `GET /v1/rules`

Returns custom anomaly rules for the tenant.

**Authentication:** Required (AgentWatch token)

### `POST /v1/rules`

Creates a custom anomaly rule. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

**Request Body:**

```json
{
  "name": "Block high-cost models",
  "enabled": true,
  "priority": 100,
  "condition": {
    "model_pattern": "gpt-4*",
    "min_prompt_tokens": 10000
  },
  "action": "block",
  "action_config": {}
}
```

**Valid actions:** `allow`, `block`, `throttle`, `alert`, `tag`

### `DELETE /v1/rules?id=:ruleId`

Deletes a custom rule. **Requires Pro plan.**

**Authentication:** Required (AgentWatch token, Pro plan)

---

## Cost Estimation

### `POST /v1/estimate-cost`

Estimates cost for a single LLM call without authentication.

**No Authentication Required**

**Request Body:**

```json
{
  "model": "gpt-4o",
  "prompt_tokens": 1000,
  "completion_tokens": 500
}
```

Alternatively, pass `messages` array for automatic token estimation:

```json
{
  "model": "gpt-4o",
  "messages": [{"role": "user", "content": "Hello!"}]
}
```

**Response:**

```json
{
  "model": "gpt-4o",
  "price_found": true,
  "matched_via": "exact",
  "pricing": {
    "prompt_cost_per_1m": 2.5,
    "completion_cost_per_1m": 10.0
  },
  "cost": {
    "prompt": 0.0025,
    "completion": 0.005,
    "total": 0.0075
  },
  "tokens": {
    "prompt": 1000,
    "completion": 500,
    "total": 1500
  }
}
```

**curl Example:**

```bash
curl -X POST https://your-domain.workers.dev/v1/estimate-cost \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "prompt_tokens": 1000,
    "completion_tokens": 500
  }'
```

### `POST /v1/cost/estimate`

Pre-execution cost estimation for multi-step workflows. **Requires authentication.**

**Authentication:** Required (AgentWatch token)

**Request Body:**

```json
{
  "steps": [
    {
      "model": "gpt-4o",
      "prompt_tokens": 1000,
      "completion_tokens": 500,
      "provider": "openai"
    },
    {
      "model": "claude-3-5-sonnet-20241022",
      "prompt_tokens": 2000,
      "completion_tokens": 1000
    }
  ]
}
```

**Response:**

```json
{
  "total_estimated_cost_usd": 0.0225,
  "step_count": 2,
  "steps": [
    {
      "model": "gpt-4o",
      "prompt_tokens": 1000,
      "completion_tokens": 500,
      "estimated_cost_usd": 0.0075
    },
    {
      "model": "claude-3-5-sonnet-20241022",
      "prompt_tokens": 2000,
      "completion_tokens": 1000,
      "estimated_cost_usd": 0.015
    }
  ]
}
```

**curl Example:**

```bash
curl -X POST https://your-domain.workers.dev/v1/cost/estimate \
  -H "Authorization: Bearer aw_live_abc123def456" \
  -H "Content-Type: application/json" \
  -d '{
    "steps": [
      {"model": "gpt-4o", "prompt_tokens": 1000, "completion_tokens": 500}
    ]
  }'
```

---

## Data Ingestion

### `POST /v1/ingest`

Ingests a log record for an LLM request that occurred outside the proxy.

**Authentication:** Required (AgentWatch token)

**Request Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `x-agentwatch-team` | No | Team name (defaults to `default`) |

**Request Body:**

```json
{
  "model": "gpt-4o",
  "provider": "openai",
  "prompt_tokens": 1500,
  "completion_tokens": 800,
  "latency_ms": 1200,
  "session_id": "session_abc123",
  "iteration_index": 3,
  "identified_risks": ["PII_EMAIL"],
  "project": "my-project",
  "team": "engineering"
}
```

**Response:** `200 OK` with body `"Success"`

---

## Budget Check

### `GET /v1/budget-check`

Checks if a session has exceeded its budget.

**Authentication:** Required (AgentWatch token)

| Query Param | Required | Description |
|-------------|----------|-------------|
| `session_id` | Yes | Session ID to check |
| `limit_usd` | No | Budget limit in USD |

**Response:**

```json
{
  "exceeded": false,
  "spent_usd": 0.042,
  "limit_usd": 0.50,
  "cumulative_tokens": 15000
}
```

---

## Data Residency

### `GET /v1/residency`

Returns the tenant's data residency configuration.

**Authentication:** Required (AgentWatch token)

### `POST /v1/residency`

Updates data residency configuration.

**Authentication:** Required (AgentWatch token)

**Request Body:**

```json
{
  "region": "eu",
  "data_residency_enforced": true,
  "eu_fallback_allowed": true
}
```

**Valid regions:** `global`, `eu`, `us`, `apac`

---

## SSO / SAML

### `GET /v1/sso/saml/init`

Initiates SAML SSO authentication flow. Redirects to the Identity Provider. **Enterprise only. Requires `SSO_ENABLED=true`.**

**Authentication:** None (redirect-based)

| Query Param | Required | Description |
|-------------|----------|-------------|
| `tenant_id` | Yes | Tenant ID to authenticate |

**Response:** `302 Redirect` to IdP SSO URL

### `POST /v1/sso/saml/acs`

SAML Assertion Consumer Service. Processes the SAML response from the IdP. **Enterprise only. Requires `SSO_ENABLED=true`.**

**Authentication:** None (SAML response)

**Request:** `application/x-www-form-urlencoded` with `SAMLResponse` and `RelayState`

**Response:** HTML page with JavaScript redirect to dashboard on success

---

### `POST /v1/auth/signup`

Creates a new user account and provisions a tenant.

**No Authentication Required**

**Rate Limited:** Per IP

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Password Requirements:** Minimum 8 characters, at least one letter and one number.

**Response:**

```json
{
  "rawToken": "aw_live_...",
  "tenantId": "tenant_live_..."
}
```

**curl Example:**

```bash
curl -X POST https://your-domain.workers.dev/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123"}'
```

### `POST /v1/auth/login`

Authenticates an existing user and returns their token.

**No Authentication Required**

**Rate Limited:** Per IP

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response:**

```json
{
  "rawToken": "aw_live_...",
  "tenantId": "tenant_live_..."
}
```

---

## Contact & Newsletter

### `POST /v1/contact`

Sends a contact/access request email.

**No Authentication Required**

**Rate Limited:** Per IP

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@company.com",
  "company": "Acme Corp",
  "spend": "$1000/mo",
  "plan": "enterprise"
}
```

### `POST /v1/newsletter/subscribe`

Subscribes an email to the newsletter.

**No Authentication Required**

**Request Body:**

```json
{
  "email": "subscriber@example.com"
}
```

---

## Admin Endpoints

### `POST /v1/admin/provision`

Provisions a new tenant. **Requires `x-admin-secret` header.**

**Authentication:** Admin secret

**Request Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `x-admin-secret` | Yes | Admin provisioning secret |

**Request Body:**

```json
{
  "email": "customer@company.com"
}
```

### `POST /v1/admin/budget`

Configures a team budget via admin API. **Requires `x-admin-secret` header.**

**Authentication:** Admin secret

**Request Body:**

```json
{
  "tenantId": "tenant_abc123",
  "team": "engineering",
  "monthlyBudgetUsd": 1000,
  "alertThresholdPct": 80,
  "hardStop": true
}
```

---

## Utility Endpoints

### `GET /healthz`

Health check endpoint.

**No Authentication Required**

**Response:** `200 OK` with body `ok`

### `GET /v1/models`

Returns list of supported models.

**No Authentication Required**

### `GET /v1/models/:modelId`

Returns details for a specific model.

**No Authentication Required**

### `GET /robots.txt`

Returns robots.txt for SEO.

### `GET /sitemap.xml`

Returns sitemap.xml for SEO.
