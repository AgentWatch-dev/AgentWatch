---
title: "Introduction"
description: "Welcome to the AgentWatch Documentation"
---

# AgentWatch

**Proactive LLM Governance Platform** — Prevent runaway agent loops from burning your budget before it starts.

## What is AgentWatch?

AgentWatch is an ultra-low latency API proxy that intercepts, manages, and enforces budget constraints on LLM API requests at the edge. It acts as a proactive governance layer between your application and upstream providers like OpenAI and Anthropic.

## The Problem

As engineering teams adopt autonomous LLM agents — coding assistants, research bots, recursive planners — they face a critical financial vulnerability: **the runaway loop**.

If an agent gets stuck in a recursive error-correction loop, it can execute hundreds of API calls per minute. Because each iteration appends the previous output to the context window, token size grows quadratically. A single stuck agent can burn thousands of dollars in minutes.

```
Iteration 1:   1,000 tokens  →  $0.003
Iteration 10:  10,000 tokens →  $0.030
Iteration 50:  250,000 tokens → $0.750
Iteration 100: 1,000,000 tokens → $3.000
```

Passive monitoring tools only report this *after* the budget is gone. AgentWatch prevents it *before* the call is made.

## The Solution

AgentWatch provides three layers of protection:

### 1. Synchronous Budget Enforcement

When your application makes an LLM call via the AgentWatch proxy, AgentWatch performs a synchronous budget check. If the session's cumulative token cost exceeds the configured limit, the request is blocked instantly and a 402 Payment Required response is returned.

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8787/v1/proxy/openai",
    api_key="aw_live_xxx:sk-proj-yyy",
    default_headers={
        "X-AgentWatch-Session-Budget-Usd": "2.00",
    }
)

try:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Refactor this module..."}]
    )
except Exception as e:
    print(f"Blocked: {e}")
```

### 2. Inline Anomaly Detection

AgentWatch detects runaway behavior before the budget is exhausted. It maintains a rolling window of the last 5 iterations per session and calculates token growth ratios. If three consecutive iterations show `>1.4x` prompt growth — the hallmark of a context-appending loop — an alert is fired via Slack webhook.

### 3. Fail-Open Resilience

If AgentWatch infrastructure experiences downtime, budget checks silently fail open. Your production traffic is never interrupted. This is a core design principle — AgentWatch uptime never causes customer outages.

## Key Features

| Feature | Description |
|---------|-------------|
| **Session Tracking** | Global state tracked across your entire agent network via sub-1ms Cloudflare KV edge storage |
| **Budget Enforcement** | Synchronous pre-call budget ceiling check. Drops requests instantly if limits are exceeded |
| **Anomaly Detection** | Identifies the 1.2x consecutive context-growth signature of a stuck loop (Pro/Enterprise) |
| **Fail-Open** | AgentWatch downtime never causes customer outages |
| **10 Providers** | OpenAI, Anthropic, Groq, xAI, Gemini, Azure, Bedrock, Xiaomi, Mistral, Cohere — all supported |
| **SOC 2 CC6.1** | Compliance telemetry reports with audit-ready summaries |
| **Team Budgets** | Monthly USD caps per team with hard-stop enforcement |

## Supported Providers

| Provider | Status |
|----------|--------|
| OpenAI | Supported |
| Anthropic | Supported |
| Groq | Supported |
| xAI (Grok) | Supported |
| Gemini | Supported |
| Azure OpenAI | Supported |
| AWS Bedrock | Supported |
| Xiaomi MiMo | Supported |
| Mistral | Supported |
| Cohere | Supported |

## Architecture

AgentWatch runs on Cloudflare's global edge infrastructure:

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Any App or  │────▶│  Cloudflare Edge  │────▶│  LLM Provider│
│  CLI Agent   │   │  (AgentWatch)    │     │  (OpenAI,    │
└─────────────┘     └──────────────────┘     │   Anthropic) │
                            │                 └─────────────┘
                            │ KV (session state)
                            │ Queue (telemetry buffer)
                            ▼
                    ┌──────────────────┐
                    │    Supabase       │
                    │  (Postgres logs)  │
                    └──────────────────┘
```

## Next Steps

- **[Quickstart](/quickstart)** — Get running in under 2 minutes
- **[Architecture](/architecture)** — Understand the system design
- **[Session Budgets](/budgets)** — Configure budget enforcement
- **[Local & No-Code Agents](/local-agents)** — Use with CLI agents and IDEs
