# Roadmap

Technical features planned for AgentWatch development.

## Short-term (1-3 months)

- **LangChain / LlamaIndex Integration** — First-class support for popular agent frameworks with automatic session tracking and token attribution
- **Semantic Caching Improvements** — Fuzzy cache matching using embedding similarity, configurable TTL per model, cache warming strategies
- **Dashboard Performance** — Pagination for large datasets, WebSocket live updates, exportable charts
- **Request Replay** — Replay failed or sampled requests for debugging and testing
- **Model Pricing API** — Public endpoint for querying current model pricing and rate limits

## Medium-term (3-6 months)

- **SOC 2 Type II** — Automated evidence collection, continuous monitoring dashboards, audit-ready exports
- **HIPAA Compliance Mode** — PHI detection rules, encryption-at-rest verification, BAA support
- **Advanced Analytics** — Cost forecasting, anomaly root-cause analysis, team efficiency metrics
- **Multi-Region Deployment** — Worker deployments in EU, US, and APAC with automatic failover
- **Webhook Event System** — Configurable event hooks for budget alerts, anomalies, and policy violations

## Long-term (6-12 months)

- **Dynamic Model Routing** — Automatically route requests to the most cost-effective model based on task complexity and budget constraints
- **Multi-Key BYOK** — Support multiple provider keys per tenant with automatic failover and load balancing
- **Agent Wallets** — Per-agent credit allocations with real-time balance tracking and automatic top-up
- **Policy-as-Code** — Declarative governance rules in YAML/Terraform with version control and CI/CD integration
- **Observability Pipeline** — OpenTelemetry-compatible tracing with span-level token attribution
