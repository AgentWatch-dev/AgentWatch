# Contributing to AgentWatch

Thank you for your interest in contributing to AgentWatch! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment for all contributors

## Getting Started

### Prerequisites

- Node.js 18+
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

## Architecture

Before contributing, read:
- [ARCHITECTURE.md](docs/architecture.md) — System design
- [README.md](README.md) — Overview and quick start

## Security

If you discover a security vulnerability, please report it responsibly:
- Email: security@agent-watch.dev
- Do NOT open a public issue for security vulnerabilities

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
