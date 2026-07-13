---
title: "Anomaly Detection"
description: "Detect runaway agent loops before budget is exhausted."
---

# Anomaly Detection

AgentWatch detects runaway agent loops heuristically, before the budget is even exhausted. This provides an early warning system that catches problems at iteration 4, not iteration 100.

## How It Works

The AgentWatch edge engine maintains a **rolling window of the last 5 iterations** for every active session. On each ingest request, it calculates the token growth ratio between consecutive iterations.

### The Quadratic Growth Signature

When an agent gets stuck in a context-appending loop, each iteration appends the previous output to the context window. This causes token counts to grow quadratically:

```
Iteration 1:  1,000 tokens
Iteration 2:  1,200 tokens  (1.2x growth)
Iteration 3:  1,440 tokens  (1.2x growth)
Iteration 4:  1,728 tokens  (1.2x growth)  ← ALERT FIRED
```

The detection algorithm identifies this pattern when:
1. At least 4 data points exist in the rolling window
2. The last 3 growth ratios are all `> 1.2x` and monotonically increasing

### Why 1.2x?

The 1.2x threshold is calibrated to distinguish between:
- **Normal variation** — Token counts fluctuate ±20% between iterations (normal)
- **Document processing** — A one-time spike when processing a large document (not sustained)
- **True runaway loops** — Sustained quadratic growth from context accumulation

::: warning Plan Requirement
Anomaly detection requires a **Pro or Enterprise** plan. Free plans receive basic budget enforcement only.
:::

## Alert Channels

When an anomaly is detected, AgentWatch fires an alert via:

### Slack Webhook

Configure `SLACK_WEBHOOK_URL` in your Worker environment:

```bash
wrangler secret put SLACK_WEBHOOK_URL
```

Alert format:
```
🚨 *Runaway Agent Detected* 🚨
Session `ses_8f2k9x3m` showed quadratic growth signature.
Recent prompt tokens: [100, 150, 220, 330, 495]
```

### Deduplication

Alerts are deduplicated per session. Once an alert fires for a session, it won't fire again until the session expires from KV (24 hours). This prevents alert fatigue from a single long-running session.

## Configuration

Anomaly detection is automatic for all sessions with 4+ iterations. No configuration required.

### Custom Rules

For more granular control, you can create custom anomaly rules via the Rules API (Pro/Enterprise only):

```bash
curl -X POST http://localhost:8787/v1/rules \
  -H "Authorization: Bearer aw_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "block-high-growth",
    "condition": { "prompt_tokens_min": 50000 },
    "action": "block",
    "priority": 200
  }'
```

## Limitations

- Detection requires at least 4 iterations per session
- One-time document processing spikes may trigger false positives (but won't block — only alert)
- The 1.2x threshold is tuned for context-appending loops; other failure modes may have different signatures
