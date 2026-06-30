# AgentWatch

Runtime governance for AI agents. Budget enforcement, loop detection, and compliance — at the edge.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-317-passing-brightgreen)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](#)

## What is AgentWatch?

AgentWatch is an edge proxy that sits between your application and LLM providers (OpenAI, Anthropic, Groq, xAI, Gemini, Azure, Bedrock). It enforces budget constraints, detects runaway agent loops, and provides compliance telemetry — all with sub-10ms latency.

**The problem:** Autonomous AI agents can get stuck in recursive loops, burning thousands of dollars before a human intervenes. Traditional monitoring tools report this _after_ the damage is done. AgentWatch prevents it _before_ the call is made.

## Features

- **Pre-call budget enforcement** — Block requests before they hit the provider
- **Session-level tracking** — Track cumulative spend across hundreds of API calls
- **Runaway loop detection** — Detect quadratic token growth at iteration 4
- **10 providers** — OpenAI, Anthropic, Groq, xAI, Gemini, Azure, Bedrock, Xiaomi, Mistral, Cohere
- **Edge caching** — Cache identical prompts for faster responses
- **Custom anomaly rules** — Define your own detection policies
- **Team budgets** — Monthly USD caps per team with hard-stop enforcement
- **Compliance telemetry** — SOC 2 CC6.1 aligned audit logs
- **Zero data retention** — Prompt content is never stored

## Quick Start

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

| Variable                    | Required | Description                      |
| --------------------------- | -------- | -------------------------------- |
| `SUPABASE_URL`              | Yes      | Supabase project URL             |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes      | Supabase admin key               |
| `TENANT_TOKEN_MAP`          | Yes      | JSON map of tokens to tenant IDs |
| `ADMIN_SECRET`              | Yes      | Admin endpoint authentication    |
| `OPENAI_API_KEY`            | Yes      | Your OpenAI API key              |
| `RATE_LIMITER`              | No       | Cloudflare RateLimiter binding   |

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

317 tests covering authentication, budget enforcement, compliance, dashboard, input validation, PII detection, rules, SAML, SLA, streaming, tenant isolation, and resilience.

## Project Structure

```
agentwatch/
├── src/                    # Core proxy/router
│   ├── index.ts            # Main Worker (proxy, auth, billing)
│   ├── balance_do.ts       # TenantBalance Durable Object
│   ├── session_do.ts       # SessionTracker Durable Object
│   ├── login.ts            # Auth/signup UI
│   ├── saml.ts             # SAML SSO implementation
│   ├── dashboard.ts        # Dashboard UI/API
│   ├── classifier.ts       # PII/risk detection
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
├── tests/                  # Test suite (317 tests)
├── docs/                   # Technical documentation
├── examples/               # Usage examples
├── wrangler.toml           # Cloudflare Workers config
└── package.json
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[Apache License 2.0](LICENSE)
