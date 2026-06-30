---
title: "Quickstart"
description: "Start protecting your agents in under 2 minutes."
---

# Quickstart

Get AgentWatch running in under 2 minutes. This guide covers installation, configuration, and your first budget-protected API call.

## Zero Dependency

AgentWatch requires **no proprietary SDK**. You use the standard OpenAI or Anthropic SDKs exactly as you normally would. 

Instead of an SDK, you configure your client to point to the AgentWatch Edge Proxy and provide a combined API key.

## Step 1: Install the Standard SDK

If you haven't already, install the official SDK for your provider.

### Python

```bash
pip install openai
```

### TypeScript

```bash
npm install openai
```

## Step 2: Initialize with Combined Key

AgentWatch uses a "Bring Your Own Key" (BYOK) architecture. You combine your AgentWatch Developer Token with your real Provider API Key using a colon (`:`) separator.

`aw_live_xxx:sk-proj-yyy`

AgentWatch parses this key, uses the left half for identity and budget enforcement, and forwards the right half securely to the provider.

### Python

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8787/v1/proxy/openai",
    api_key="aw_live_your_token:sk-proj-your-real-key"
)
```

### TypeScript

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
    baseURL: "http://localhost:8787/v1/proxy/openai",
    apiKey: "aw_live_your_token:sk-proj-your-real-key"
});
```

## Step 3: Make API Calls

Use the client exactly as you normally would. Budget enforcement happens automatically at the edge.

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Refactor this module..."}]
)
print(response.choices[0].message.content)
```

If the session exceeds its budget limit, the API will return an HTTP `402 Payment Required` error, instantly blocking the execution before the upstream LLM provider is billed.

## What Just Happened

1. Your request was securely routed through the AgentWatch edge proxy.
2. A sub-millisecond pre-flight budget check was performed against Cloudflare KV.
3. Token costs were calculated in real-time using the provider's pricing.
4. Telemetry was logged asynchronously (adding zero latency to your call).

## Next Steps

- **[Session Budgets](/budgets)** — Learn how to set session budgets
- **[Anomaly Detection](/anomaly-detection)** — Detect runaway loops early
- **[Local & No-Code Agents](/local-agents)** — Use AgentWatch with CLI agents and IDEs
