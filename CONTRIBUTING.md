# Contributing to AgentWatch

Thank you for your interest in contributing to AgentWatch! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment for all contributors

## Getting Started

### Quick Start

The fastest way to get started:

```bash
git clone https://github.com/AgentWatch-dev/agentwatch.git
cd agentwatch
./scripts/setup.sh
```

### Prerequisites

- Node.js 20+
- npm
- A Cloudflare account (for deployment)
- A Supabase account (for database)

### Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/agentwatch.git
   cd agentwatch
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

4. Fill in your API keys in `.dev.vars`

5. Start the development server:
   ```bash
   npm run dev
   ```

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run typecheck
```

## Making Changes

### Branch Naming

- `feature/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation changes
- `test/description` — Test additions

### Commit Messages

Use clear, descriptive commit messages:
- `feat: add provider failover for Azure`
- `fix: resolve timing leak in admin secret comparison`
- `docs: update quickstart guide`
- `test: add SAML replay protection tests`

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm test` and `npm run typecheck`
4. Write clear PR description explaining what and why
5. Request review from maintainers

## Reporting Issues

### Bug Reports

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Node version, browser)

### Feature Requests

Include:
- Problem statement
- Proposed solution
- Alternatives considered

## Testing the Dashboard

The dashboard is a static asset bundle served by the Worker. To test changes:

1. Build the dashboard: `npm run predeploy`
2. Start the dev server: `npm run dev`
3. Open http://localhost:8787 in your browser
4. Log in with the `ADMIN_SECRET` set in `.dev.vars`

For frontend-only changes, edit files in `website/` and rebuild. The
dashboard reads configuration from the Worker API, so a running dev
server is required.

## Architecture

Before contributing, read:
- [ARCHITECTURE.md](docs/architecture.md) — System design and request flow
- [README.md](README.md) — Overview and quick start

## Good First Issues

Looking for a way to contribute? Here are some starter tasks:

- **Add provider pricing data** — Update `scripts/generate-pricing.cjs` with new model pricing from provider documentation
- **Improve error messages** — Make 402/403 responses include clearer guidance in the response body
- **Add example tests** — Write integration tests for examples in `examples/` using the test infrastructure in `tests/`
- **Documentation improvements** — Fix typos, add missing API examples, or clarify setup steps in `docs/`
- **Dashboard accessibility** — Improve keyboard navigation and screen reader support in the dashboard

## Maintainers

- AgentWatch Core Team — [open an issue](https://github.com/agentwatch/agentwatch/issues)

## Security

If you discover a security vulnerability, please report it responsibly:
- Email the maintainers via [GitHub issues](https://github.com/agentwatch/agentwatch/issues) (mark as security)
- Do NOT open a public issue for security vulnerabilities

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
