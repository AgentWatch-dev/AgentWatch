---
title: "Session & Team Budgets"
description: "Enforce strict financial constraints on agents and teams."
---

# Session & Team Budgets

AgentWatch provides two levels of budget enforcement: **session budgets** for individual agent runs and **team budgets** for organization-wide spend caps.

## Session Budgets

Session budgets protect individual agent runs by setting a per-session USD ceiling.

### How It Works

Because AgentWatch is zero-dependency, you configure budgets by passing custom headers with your standard HTTP request.

1. You pass `X-AgentWatch-Session-Budget-Usd` as an extra header.
2. Before each API call, the Edge Proxy checks cumulative token spend against the limit.
3. If exceeded, the request is blocked and returns an HTTP `402 Payment Required` error.
4. The upstream LLM provider is never billed for blocked requests.

### Configuration

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8787/v1/proxy/openai",
    api_key="aw_live_xxx:sk-proj-yyy",
    default_headers={
        "X-AgentWatch-Session-Id": "ci-run-123",
        "X-AgentWatch-Session-Budget-Usd": "2.00",
    }
)

try:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Refactor this module..."}]
    )
except Exception as e:
    # Handles 402 Payment Required
    print(f"Blocked: {e}")
```

### 2. Exact Per-Model Cost Calculation

Unlike traditional API gateways that use flat token rates, AgentWatch calculates exact USD costs natively at the edge based on the precise model being used. 

For example, if an agent uses `gpt-4o-mini`, the edge proxy deducts precisely $0.15 per million input tokens and $0.60 per million output tokens from the `TenantBalance` Durable Object.

If the balance drops below $0.00, the proxy instantly blocks all subsequent requests with a `402 Payment Required` HTTP error. This is evaluated synchronously in the hot path before forwarding requests upstream.

### Session State Persistence

Session state is stored in Cloudflare KV with a 24-hour TTL. This means:

- Session budgets survive process restarts
- Multiple scripts passing the same session ID share state
- Sessions expire after 24 hours of inactivity

## Team Budgets

Team budgets allow administrators to cap total spend across all models and environments for an entire team.

### Setting the Budget

You can set team budgets directly in the AgentWatch Dashboard under the "Teams & Budgets" tab.

1. **Create the Team:** Click "+ Create Team" to register your team.
2. **Set the Budget:** Assign a monthly USD cap and alert thresholds.
3. **Generate a Developer Key:** In the "Access Control" tab, generate a key strictly assigned to your team.

### Enforcing Team Budgets

Because the Developer Key is strictly bound to the team on the backend, **no code changes are required** by the developer. The proxy automatically maps the usage to the team's budget based on the key used.

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8787/v1/proxy/openai",
    api_key="aw_live_xxx:sk-proj-yyy"
    # No team headers needed! The proxy knows the team from the aw_live_xxx key.
)
```


| Mode | Behavior |
|------|----------|
| `hard_stop: true` | Requests blocked when team budget exceeded (403) |
| `hard_stop: false` | Alert logged but requests proceed |

## Budget Hierarchy

When both session and team budgets are configured:

1. **Session budget** is checked first (pre-flight)
2. If session budget passes, **team budget** is checked
3. The more restrictive limit applies

This means a session budget of $2.00 will block at $2.00 even if the team has $500 remaining.
