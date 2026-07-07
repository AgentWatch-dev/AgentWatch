# Examples

Working examples demonstrating AgentWatch usage across Python, TypeScript, frameworks, and advanced use cases.

## Quick Start

All examples read API keys from environment variables:

```bash
export AGENTWATCH_KEY="aw_live_your_token"
export OPENAI_KEY="sk-proj-your-key"
```

## Python

```bash
cd python
pip install openai requests

# Basic proxy usage
python basic_usage.py

# PII detection and blocking
python pii-blocking.py

# Custom anomaly rules
python anomaly-rules.py

# Team-level budgets
python team-budgets.py

# Per-agent budgets
python agent-budgets.py

# Pre-execution cost estimation
python cost-estimation.py
```

## TypeScript

```bash
cd typescript
npm install openai

# Basic proxy usage
npx tsx basic_usage.ts

# PII detection and blocking
npx tsx pii-blocking.ts

# Streaming with budget enforcement
npx tsx streaming.ts
```

## Framework Integrations

```bash
cd framework

# LangChain
pip install langchain langchain-openai
python langchain.py

# CrewAI
pip install crewai crewai-tools
python crewai.py
```

## Advanced

```bash
cd advanced

# CI/CD budget enforcement
pip install openai
python ci-pipeline.py
```

## What These Examples Show

1. **Proxy setup** — Point your SDK to AgentWatch instead of the provider
2. **Session budgets** — Set a dollar ceiling per session
3. **Streaming** — Real-time budget enforcement mid-generation
4. **PII blocking** — Detect and prevent sensitive data leakage
5. **Custom rules** — Anomaly detection, throttling, and alerts
6. **Team/agent budgets** — Multi-level budget enforcement
7. **Cost estimation** — Pre-execution cost previews
8. **Framework integration** — LangChain and CrewAI support
9. **CI/CD governance** — Budget enforcement in pipelines
