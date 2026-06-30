# Architecture

AgentWatch is an edge proxy built on Cloudflare Workers that provides runtime governance for AI agents.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Application                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Standard SDK (OpenAI / Anthropic / any provider)   │    │
│  │  ├── HTTP Request formatting                        │    │
│  │  └── Base URL pointing to AgentWatch                │    │
│  └─────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare Edge Network                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  AgentWatch Worker                                   │    │
│  │  ├── Authentication (Bearer token + BYOK)            │    │
│  │  ├── Rate limiting (per-tenant, native binding)      │    │
│  │  ├── Budget check (KV lookup + Durable Object)       │    │
│  │  ├── Rule evaluation (custom anomaly rules)          │    │
│  │  ├── Data residency routing (EU/US/APAC)             │    │
│  │  ├── Proxy routing (10 providers)                    │    │
│  │  ├── Stream budget enforcement (mid-generation)      │    │
│  │  └── Telemetry ingestion → Queue → Supabase          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Cloudflare   │  │  Durable     │  │  Cloudflare  │      │
│  │  KV           │  │  Objects     │  │  Queues      │      │
│  │  (session     │  │  (atomic     │  │  (telemetry  │      │
│  │   state)      │  │   counters)  │  │   buffer)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase (Postgres)                       │
│  ├── llm_request_logs (telemetry)                            │
│  ├── developer_keys (API key management)                     │
│  ├── audit_logs (security audit trail)                       │
│  ├── tenant_rules (custom rules engine)                      │
│  └── tenant_settings (per-tenant configuration)              │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow

### 1. API Call Initiated

Your application sends a request to AgentWatch instead of the LLM provider. The SDK constructs the HTTP request and sends it to the AgentWatch proxy URL.

### 2. Edge Proxy Processing

The Worker receives the request and executes:

1. **Authentication** — Validate Bearer token via KV lookup (primary) or static map fallback
2. **Rate limiting** — Per-tenant rate limit check using native Cloudflare binding
3. **Rule evaluation** — Custom anomaly rules from tenant configuration
4. **Data residency** — Check `x-agentwatch-residency` header and route to EU endpoints if needed
5. **Proxy routing** — Route to the correct upstream provider
7. **Response forwarding** — Stream response back to SDK
8. **Stream monitoring** — If streaming, monitor token usage and terminate if budget exceeded

### 3. Asynchronous Telemetry

After the response is returned:

1. **Queue dispatch** — Log record sent to Cloudflare Queue
2. **KV update** — Session token count incremented
3. **Durable Object update** — Atomic budget counter updated
4. **Anomaly check** — Rolling window growth ratio analysis
5. **Supabase write** — Queue consumer writes to `llm_request_logs`

## Key Components

### Worker (`src/index.ts`)
The main Cloudflare Worker that handles all request routing, authentication, budget enforcement, and proxy forwarding. ~4,700 lines.

### Durable Objects
- **SessionTracker** (`src/session_do.ts`) — Tracks per-session token usage and detects runaway loops (50 request threshold)
- **TenantBalance** (`src/balance_do.ts`) — Atomic balance management for per-tenant billing

### KV Storage
- `tenant:token:{token}` — Token-to-tenant mapping
- `tenant:plan:{tenantId}` — Plan and subscription status
- `t:{tenantId}:s:{sessionId}:usd` — Per-session USD spend
- `t:{tenantId}:s:{sessionId}:tokens` — Per-session token count

### Supabase Database
- `llm_request_logs` — Request telemetry (90-day retention)
- `developer_keys` — API key metadata
- `audit_logs` — Security audit trail
- `tenant_rules` — Custom anomaly rules
- `tenant_settings` — Per-tenant configuration

## Security Model

- **BYOK (Bring Your Own Key)** — AgentWatch never stores user API keys
- **Timing-safe comparisons** — All token/secret comparisons use `crypto.subtle.timingSafeEqual`
- **Row-Level Security** — All Supabase tables have RLS with service_role-only policies
- **Fail-open design** — Governance never becomes a single point of failure

## Design Decisions

### Why a proxy instead of middleware?
- Zero code changes for users (just change BASE_URL)
- Language agnostic (works with any HTTP client)
- Edge enforcement (sub-10ms at Cloudflare's edge)
- No vendor lock-in (remove by changing URL back)

### Why Cloudflare Workers?
- Global edge deployment (200+ locations)
- Sub-millisecond cold starts
- Built-in KV, Durable Objects, Queues
- No server management

### Why Supabase?
- Managed PostgreSQL with real-time capabilities
- Row-Level Security for tenant isolation
- RPC functions for complex queries
- Built-in auth for SSO support
