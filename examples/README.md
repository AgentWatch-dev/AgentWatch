# Examples

Minimal working examples demonstrating AgentWatch usage.

## Python

```bash
cd python
pip install openai
export AGENTWATCH_KEY="aw_live_your_token"
export OPENAI_KEY="sk-proj-your-key"
python basic_usage.py
```

## TypeScript

```bash
cd typescript
npm install openai
export AGENTWATCH_KEY="aw_live_your_token"
export OPENAI_KEY="sk-proj-your-key"
npx tsx basic_usage.ts
```

## What These Examples Show

1. **Proxy setup** — Point your SDK to AgentWatch instead of the provider
2. **Session budgets** — Set a dollar ceiling per session
3. **API calls** — Make requests through the proxy transparently
