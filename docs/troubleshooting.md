---
title: "Troubleshooting"
description: "Common issues and their solutions."
---

# Troubleshooting

## Common Issues

### 401 Unauthorized

**Symptom:** All API calls return 401.

**Causes:**
1. Missing `Authorization` header
2. Wrong token format (must be `Bearer aw_live_xxx`, not `Token aw_live_xxx`)
3. Token not in `TENANT_TOKEN_MAP` or KV store

**Fix:**
```python
# Correct format
import openai

client = openai.OpenAI(
    base_url="http://localhost:8787/v1/proxy/openai",
    api_key="aw_live_xxx:sk-proj-xxx",
)
```

### Budget Check Always Passes

**Symptom:** Requests are not blocked even when spending exceeds the session budget.

**Causes:**
1. `X-AgentWatch-Session-Budget-Usd` header is not set
2. Session ID is not consistent across calls

**Fix:**
```python
# Pass budget headers with your requests
client = openai.OpenAI(
    base_url="http://localhost:8787/v1/proxy/openai",
    api_key="aw_live_xxx:sk-proj-xxx",
    default_headers={
        "X-AgentWatch-Session-Id": "consistent-id",
        "X-AgentWatch-Session-Budget-Usd": "2.00",
    }
)
```

### AgentWatch Outage Affecting Production

**Symptom:** API calls fail when AgentWatch is down.

**Cause:** AgentWatch operates as a pure proxy. If the edge is unreachable, requests fail with a connection error.

**Fix:** AgentWatch uses fail-open architecture — if the edge proxy is unreachable, budget checks are silently bypassed and requests proceed directly to the provider.

### Streaming Calls Not Counting Toward Budget

**Symptom:** Streaming calls bypass budget enforcement.

**Cause:** Token counts are unavailable until stream completion. Budget enforcement uses estimated counts.

**Fix:** This is expected behavior. Use non-streaming calls for strict budget enforcement.

### Rate Limiting (429)

**Symptom:** Requests return 429 Too Many Requests.

**Cause:** Exceeded 100 requests per minute per tenant.

**Fix:**
- Reduce request frequency
- Contact support to increase limits
- Use batch APIs where available

### Telemetry Not Appearing

**Symptom:** Logs don't appear in Supabase dashboard.

**Causes:**
1. `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` not configured
2. Queue consumer not running
3. 90-day retention purged old logs

**Fix:** Check Worker logs for Supabase connection errors.

## Performance Issues

### Slow Budget Checks

Budget checks involve a network round-trip to Cloudflare KV (5-50ms). If consistently slow:

1. Check Cloudflare status page
2. Verify Worker is deployed to the correct region
3. Consider using Durable Objects for atomic operations

### High Latency on First Request

First requests may be slower due to Worker cold start (V8 compilation). Subsequent requests are fast.

## Getting Help

- **Email:** hello@localhost
- **Health Check:** `curl http://localhost:8787/healthz`
