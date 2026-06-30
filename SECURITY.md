# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in AgentWatch, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

Email security@agent-watch.dev with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 24 hours
- **Initial assessment**: Within 48 hours
- **Resolution**: Critical issues within 7 days, others within 30 days
- **Disclosure**: Coordinated disclosure after fix is deployed

## Scope

In scope:
- The AgentWatch proxy (src/)
- Authentication and authorization
- API endpoints
- Dashboard
- Database queries

Out of scope:
- Third-party provider APIs (OpenAI, Anthropic, etc.)
- Infrastructure not managed by AgentWatch
- Social engineering attacks

## Security Measures

- All secrets stored as Cloudflare Worker secrets (encrypted at rest)
- Timing-safe comparisons for all token/secret validation
- Row-Level Security on all database tables
- Input validation on all endpoints
- CSP headers on all responses
- CORS restricted to configured origins

## Acknowledgments

We appreciate the security research community and will acknowledge reporters in our security advisories (with permission).
