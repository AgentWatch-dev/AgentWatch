# AgentWatch

### The firewall for AI agent spending

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-380-passing-brightgreen)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue)](#)

**One proxy. Ten providers. Sub-10ms. Zero SDK.**

---

## The Problem

Your AI agent just got stuck in a loop. It's retrying the same failing function call, appending each failure to its context window. Token count: 1,000 → 50,000 → 500,000.

**Cost so far: $2,400. And it's still going.**

Traditional monitoring shows you this 15 minutes later. AgentWatch **stops it before it happens**.

---

## Quick Start

**No SDK. No package. Just change your `base_url`.**

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8787/v1/proxy/openai",  # Point at AgentWatch
    api_key="sk-your-openai-key"                        # Your real key
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
    extra_headers={
        "x-agentwatch-session-id": "my-session-123",
        "x-agentwatch-budget-usd": "2.00"               # Hard limit: $2
    }
)
```

When the budget is exceeded:

```json
{
  "error": "budget_exceeded",
  "message": "Session budget exceeded. Current: $1.85, Limit: $1.50",
  "code": 402
}
```

The request is blocked **before** it reaches OpenAI. Zero spend.

**For CLI tools (Cursor, Claude Code, etc.):**

```bash
export OPENAI_BASE_URL="http://localhost:8787/v1/proxy/openai"
export OPENAI_API_KEY="sk-your-openai-key"
```

---

## Open Core

AgentWatch is open source. The community edition is free. Pro features are gated.

| | Community (Free) | Pro ($99/mo) | Enterprise |
|---|:---:|:---:|:---:|
| **Requests/month** | 50K | 500K | Unlimited |
| LLM proxy (10 providers) | ✅ | ✅ | ✅ |
| Session budgets | ✅ | ✅ | ✅ |
| Team budgets | — | ✅ | ✅ |
| Per-agent budgets | — | ✅ | ✅ |
| Loop detection | Basic (50-req) | State repetition | ✅ |
| PII detection | Tag only | Block (403) | Block + custom |
| Edge caching | — | ✅ | ✅ |
| Custom anomaly rules | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| Cost estimation | ✅ | ✅ | ✅ |
| SSO (SAML) | — | — | ✅ |
| Data residency | — | — | ✅ |
| SOC 2 compliance | — | — | ✅ |
| SLA monitoring | — | — | ✅ |

**The code is Apache 2.0.** You can read everything. Pro features require a license key from [agentwatch.dev](https://agentwatch.dev).

---

## How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Your App   │────▶│  AgentWatch Edge │────▶│ LLM Provider│
│             │     │  (Budget Check)  │     │  (OpenAI,   │
└─────────────┘     └──────────────────┘     │   Anthropic)│
                            │                └─────────────┘
                            │ KV (session state)
                            ▼
                    ┌──────────────────┐
                    │    Supabase      │
                    │  (Audit logs)    │
                    └──────────────────┘
```

1. Your app sends a request to AgentWatch instead of the LLM provider
2. AgentWatch checks the session budget against Cloudflare KV
3. If budget is exceeded → blocked (402), zero spend
4. Otherwise → forwarded to the provider
5. Token usage is logged asynchronously

**Key design decisions:**
- **Fail-open** — If AgentWatch fails, requests pass through. Your app never goes down.
- **BYOK** — Your API keys are never stored. The `aw_token:real_key` pattern identifies tenants while forwarding keys upstream.
- **Edge-first** — Budget checks happen at Cloudflare's edge (sub-10ms), not in your app.

---

## Supported Providers

| Provider | Status |
|----------|:------:|
| OpenAI | ✅ |
| Anthropic | ✅ |
| Groq | ✅ |
| xAI (Grok) | ✅ |
| Google Gemini | ✅ |
| Azure OpenAI | ✅ |
| AWS Bedrock | ✅ |
| Xiaomi MiMo | ✅ |
| Mistral | ✅ |
| Cohere | ✅ |

---

## Deployment

### Self-Hosted (Cloudflare Workers)

```bash
git clone https://github.com/AgentWatch-dev/agentwatch.git
cd agentwatch
npm install
cp .dev.vars.example .dev.vars   # Add your Supabase + API keys
npm run dev                       # http://localhost:8787
```

### Docker

```bash
docker run -p 8787:8787 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  -e TENANT_TOKEN_MAP='{"your-token":"tenant_1"}' \
  agentwatch/agentwatch
```

### Hosted

Coming soon at [agentwatch.dev](https://agentwatch.dev). No infrastructure required.

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase admin key |
| `TENANT_TOKEN_MAP` | Yes | JSON map of tokens to tenant IDs |
| `ADMIN_SECRET` | Yes | Admin endpoint authentication |
| `OPENAI_API_KEY` | Yes* | Your OpenAI API key (*for OpenAI proxy) |
| `SITE_URL` | No | Your deployment URL (default: http://localhost:8787) |
| `SSO_ENABLED` | No | Enable SAML SSO (Enterprise) |
| `CORS_ALLOWED_ORIGIN` | No | Allowed CORS origin (default: *) |

### Request Headers

| Header | Description |
|--------|-------------|
| `x-agentwatch-session-id` | Session ID (required for budgets) |
| `x-agentwatch-budget-usd` | Budget ceiling in USD (e.g., `2.00`) |
| `x-agentwatch-team` | Team name for cost attribution |
| `x-agentwatch-agent` | Agent name for spend tracking |

---

## API Reference

Full documentation: [docs/api-reference.md](docs/api-reference.md)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/proxy/:provider/*` | POST | Main proxy endpoint |
| `/v1/dashboard/*` | GET | Dashboard data |
| `/v1/rules` | GET/POST/DELETE | Custom anomaly rules |
| `/v1/cost/estimate` | POST | Cost estimation |

---

## Testing

```bash
npm test          # 380 tests
npm run typecheck # Type checking
```

Tests run in Cloudflare Workers runtime (Miniflare). Durable Objects are real, not mocked.

---

## Project Structure

```
agentwatch/
├── src/
│   ├── index.ts            # Main Worker
│   ├── budget_do.ts        # BudgetTracker DO
│   ├── session_do.ts       # SessionTracker DO
│   ├── saml.ts             # SAML SSO
│   ├── classifier.ts       # PII detection (12 tags)
│   └── pricing.ts          # Cost estimation
├── tests/                  # 380 tests
├── docs/                   # Documentation
├── examples/               # Code examples
└── wrangler.toml           # Cloudflare config
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
git clone https://github.com/AgentWatch-dev/agentwatch.git
cd agentwatch
./scripts/setup.sh
npm test
```

---

## License

[Apache License 2.0](LICENSE)

Pro features require a license key from [agentwatch.dev](https://agentwatch.dev).
