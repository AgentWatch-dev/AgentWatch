# AgentWatch

Runtime governance for AI agents. Budget enforcement, loop detection, and compliance — at the edge.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-380-passing-brightgreen)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue)](#)
[![GitHub stars](https://img.shields.io/github/stars/AgentWatch-dev/agentwatch?style=social)](https://github.com/AgentWatch-dev/agentwatch)

**Built for teams running autonomous AI agents.** Supports OpenAI, Anthropic, Groq, and 7 other providers out of the box.

## What is AgentWatch?

AgentWatch is an edge proxy that sits between your application and LLM providers (OpenAI, Anthropic, Groq, xAI, Gemini, Azure, Bedrock). It enforces budget constraints, detects runaway agent loops, and provides compliance telemetry — all with sub-10ms latency.

**The problem:** Autonomous AI agents can get stuck in recursive loops, burning thousands of dollars before a human intervenes. Traditional monitoring tools report this _after_ the damage is done. AgentWatch prevents it _before_ the call is made.

## Features

- **Pre-call budget enforcement** — Block requests before they hit the provider
- **Session-level tracking** — Track cumulative spend across hundreds of API calls
- **Per-tool-call budgets** — Cap individual tool calls (e.g., "search tool max $0.10")
- **Per-workflow budgets** — Cap entire workflow runs
- **Runaway loop detection** — Detect quadratic token growth at iteration 4
- **State repetition detection** — Stop when same agent state repeats (configurable threshold)
- **10 providers** — OpenAI, Anthropic, Groq, xAI, Gemini, Azure, Bedrock, Xiaomi, Mistral, Cohere
- **Edge caching** — Cache identical prompts for faster responses
- **Custom anomaly rules** — Define your own detection policies
- **Team budgets** — Monthly USD caps per team with hard-stop enforcement
- **Agent budgets** — Per-agent monthly limits with hard-stop enforcement
- **Enhanced PII detection** — 12 risk tags including phone numbers, Azure keys, Slack tokens, SSH keys, DB connection strings
- **PII blocking** — Reject requests containing sensitive data
- **Pre-execution cost estimation** — Estimate multi-step costs before making calls
- **SAML SSO** — Enterprise SSO via SAML 2.0 with XML signature verification
- **Governance modes** — Observe, soft, and hard enforcement modes
- **Compliance telemetry** — SOC 2 CC6.1 aligned audit logs
- **Zero data retention** — Prompt content is never stored

## How AgentWatch Compares

| Feature | AgentWatch | Helicone | Portkey | LangSmith |
|---------|-----------|----------|---------|----------|
| Pre-call budget enforcement | ✅ Blocks before API call | ❌ Post-hoc logging | ❌ No budget blocking | ❌ No budget enforcement |
| Runaway loop detection | ✅ Catches at iteration 4 | ❌ Not available | ❌ Not available | ❌ Not available |
| Edge latency | ✅ Sub-10ms (Cloudflare) | ~50ms (SaaS round-trip) | ~50ms (SaaS round-trip) | ~100ms (SaaS round-trip) |
| Data retention | ✅ Zero — prompts never stored | Stores prompts for analytics | Stores prompts for routing | Stores traces for evaluation |
| SDK required | ✅ None — change BASE_URL | Requires SDK | Requires SDK | Requires SDK |
| Self-hostable | ✅ Yes (Cloudflare Workers) | ❌ Cloud only | ❌ Cloud only | ❌ Cloud only |

## Quick Start

**Prerequisites:** Node.js 20+, a [Supabase](https://supabase.com) project, and a Cloudflare account.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure

Copy `.dev.vars.example` to `.dev.vars` and fill in your API keys:

```bash
cp .dev.vars.example .dev.vars
```

### 3. Run locally

```bash
npm run dev
```

The proxy starts at `http://localhost:8787`.

### 4. Make a request

```bash
curl -X POST http://localhost:8787/v1/proxy/openai/v1/chat/completions \
  -H "Authorization: Bearer aw_test_token:sk-your-openai-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'
```

### What happens when budget is exceeded

When a session exceeds its budget, AgentWatch returns a `402 Payment Required` response **before** the request reaches the LLM provider:

```json
{
  "error": "budget_exceeded",
  "message": "Session budget exceeded. Current: $1.85, Limit: $1.50",
  "session_id": "my-session-123",
  "code": 402
}
```

This prevents runaway agent loops from burning through your credits.

## How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Your App   │────▶│  AgentWatch Edge │────▶│ LLM Provider│
│             │     │  (Budget Check)  │     │  (OpenAI,   │
└─────────────┘     └──────────────────┘     │   Anthropic)│
                            │                └─────────────┘
                            │ KV (session state)
                            │ Queue (telemetry)
                            ▼
                    ┌──────────────────┐
                    │    Supabase      │
                    │  (Audit logs)    │
                    └──────────────────┘
```

1. Your app sends a request to AgentWatch instead of the LLM provider
2. AgentWatch checks the session budget against Cloudflare KV
3. If budget is exceeded, the request is blocked (402)
4. Otherwise, the request is forwarded to the provider
5. Token usage is logged asynchronously for telemetry

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase admin key |
| `TENANT_TOKEN_MAP` | Yes | JSON map of tokens to tenant IDs |
| `ADMIN_SECRET` | Yes | Admin endpoint authentication |
| `OPENAI_API_KEY` | Yes* | Your OpenAI API key (*required for OpenAI proxy) |
| `SITE_URL` | No | Your site URL (default: http://localhost:8787) |
| `SSO_ENABLED` | No | Set to "true" to enable SAML SSO |
| `CORS_ALLOWED_ORIGIN` | No | Allowed CORS origin (default: *) |
| `CONTACT_EMAIL` | No | Email for contact form submissions |
| `SLACK_WEBHOOK_URL` | No | Slack webhook for alerts |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `RATE_LIMITER` | No | Cloudflare RateLimiter binding |

### Session Budgets

Set a budget per session using the `x-agentwatch-budget-usd` header:

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "..."}],
    extra_headers={
        "x-agentwatch-session-id": "my-session-123",
        "x-agentwatch-budget-usd": "2.00"
    }
)
```

### Custom Anomaly Rules

Create rules via the API to detect specific patterns:

```bash
curl -X POST http://localhost:8787/v1/rules \
  -H "Authorization: Bearer aw_test_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "block-high-growth",
    "condition": {"prompt_tokens_min": 50000},
    "action": "block",
    "priority": 200
  }'
```

## Architecture

See [ARCHITECTURE.md](docs/architecture.md) for the full system design.

### Key Design Decisions

- **Fail-open** — If AgentWatch fails, requests pass through to providers. Your app never goes down.
- **BYOK (Bring Your Own Key)** — AgentWatch never stores your API keys. The `aw_token:real_key` pattern identifies tenants while forwarding keys upstream.
- **Edge enforcement** — Budget checks happen at Cloudflare's edge (sub-10ms), not in your app.

## Supported Providers

| Provider     | Status |
| ------------ | ------ |
| OpenAI       | ✅     |
| Anthropic    | ✅     |
| Groq         | ✅     |
| xAI (Grok)   | ✅     |
| Gemini       | ✅     |
| Azure OpenAI | ✅     |
| AWS Bedrock  | ✅     |
| Xiaomi MiMo  | ✅     |
| Mistral      | ✅     |
| Cohere       | ✅     |

## Testing

```bash
npm test
```

369 tests covering authentication, budget enforcement, compliance, dashboard, input validation, PII detection, rules, SAML, SLA, streaming, tenant isolation, and resilience.

## Project Structure

```
agentwatch/
├── src/                    # Core proxy/router
│   ├── index.ts            # Main Worker (proxy, auth, billing)
│   ├── balance_do.ts       # TenantBalance Durable Object
│   ├── session_do.ts       # SessionTracker Durable Object
│   ├── budget_do.ts        # BudgetTracker Durable Object (atomic budget enforcement)
│   ├── login.ts            # Auth/signup UI
│   ├── saml.ts             # SAML SSO implementation
│   ├── dashboard.ts        # Dashboard UI/API
│   ├── classifier.ts       # PII/risk detection (12 risk tags)
│   ├── compliance.ts       # EU AI Act compliance
│   ├── sla.ts              # SLA monitoring
│   ├── cron.ts             # Scheduled jobs
│   ├── pricing.ts          # LLM cost estimation
│   ├── rules.ts            # Custom anomaly rules
│   ├── residency.ts        # EU data residency
│   ├── demo.ts             # Demo mode
│   ├── seo.ts              # SEO metadata
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Shared utilities
├── supabase/               # Database schema & migrations
├── tests/                  # Test suite (369 tests)
├── docs/                   # Technical documentation
├── examples/               # Usage examples
├── wrangler.toml           # Cloudflare Workers config
└── package.json
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[Apache License 2.0](LICENSE)
