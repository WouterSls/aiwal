# Specs Overview

## Architecture

| Spec | Status | Description |
|------|--------|-------------|
| [architecture.md](architecture/architecture.md) | NOT DONE | System architecture — frontend, backend, modules, deployment |
| [persistence-layer.md](architecture/persistence-layer.md) | NOT DONE | Database schema — users, proposals, delegations, orders (TypeORM/SQLite) |

## Frontend

| Spec | Status | Description |
|------|--------|-------------|
| [frontend-architecture-spec.md](frontend/frontend-architecture-spec.md) | NOT DONE | Next.js frontend — Tailwind/shadcn, React Query, WebSocket streaming, 50/50 chat+portfolio layout, proposal editor |

## Dynamic Wallet Integration

| Spec | Status | Description |
|------|--------|-------------|
| [INFO.md](dynamic-wallet-integration/INFO.md) | NOT DONE | Dynamic SDK embedded wallet integration |

## LLM Context Integration

| Spec | Status | Description |
|------|--------|-------------|
| [claude-interaction.md](llm-context-integration/claude-interaction.md) | NOT DONE | Claude API interaction — frontend-direct calls, context assembly, response parsing, proposal detection |

## Agent Presets

| Spec | Status | Description |
|------|--------|-------------|
| [institutional-preset.md](agent-presets/institutional-preset.md) | NOT DONE | Low-risk preset — whitelist tokens, 0.3% slippage, risk-analyst persona |
| [degen-preset.md](agent-presets/degen-preset.md) | NOT DONE | High-risk preset — any token, 5% slippage, CT degen persona |
