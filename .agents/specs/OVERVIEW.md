# Specs Overview

## Architecture

| Spec                                                              | Status   | Description                                                              |
| ----------------------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| [architecture.md](architecture/architecture.md)                   | NOT DONE | System architecture — frontend, backend, modules, deployment             |
| [backend-core-modules.md](architecture/backend-core-modules.md)   | NOT DONE | Backend module map — AppModule wiring, auth flow, design order           |
| [persistence-layer.md](architecture/persistence-layer.md)         | NOT DONE | Database schema — users, proposals, delegations, orders (TypeORM/SQLite) |

## Backend Modules

| Spec | Status | Description |
|------|--------|-------------|
| [common-module.md](backend/common-module.md) | NOT DONE | CommonModule — guards, decorators, DTOs, interceptors, error handling |
| [auth-module.md](backend/auth-module.md) | NOT DONE | AuthModule — Dynamic SDK session validation, JWT issuance, global AuthGuard |
| [users-module.md](backend/users-module.md) | NOT DONE | UsersModule — user CRUD, preset management, wallet mapping, abstract repository |
| [wallet-module.md](backend/wallet-module.md) | NOT DONE | WalletModule — Dynamic delegation webhook, AES-256 at-rest encryption, delegation material access |
| [pricefeed-module.md](backend/pricefeed-module.md) | NOT DONE | PriceFeedModule — Uniswap Quoter API prices, Base block listener, order condition monitoring |

## Frontend

| Spec                                                                   | Status   | Description                                                                                                        |
| ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| [frontend-architecture.md](architecture/frontend-architecture-spec.md) | NOT DONE | Next.js frontend — Tailwind/shadcn, React Query, WebSocket streaming, 50/50 chat+portfolio layout, proposal editor |
| [frontend-folder-setup.md](architecture/frontend-setup-spec.md)        | NOT DONE | Frontend scaffolding — flat root `frontend/`, Next.js 16 JS, independent packages, dev workflow                    |

## Dynamic Wallet Integration

| Spec                                          | Status   | Description                             |
| --------------------------------------------- | -------- | --------------------------------------- |
| [INFO.md](dynamic-wallet-integration/INFO.md) | NOT DONE | Dynamic SDK embedded wallet integration |

## LLM Context Integration

| Spec                                                                   | Status   | Description                                                                                            |
| ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| [claude-interaction.md](llm-context-integration/claude-interaction.md) | NOT DONE | Claude API interaction — frontend-direct calls, context assembly, response parsing, proposal detection |

## Agent Presets

| Spec                                                             | Status   | Description                                                             |
| ---------------------------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| [institutional-preset.md](agent-presets/institutional-preset.md) | NOT DONE | Low-risk preset — whitelist tokens, 0.3% slippage, risk-analyst persona |
| [degen-preset.md](agent-presets/degen-preset.md)                 | NOT DONE | High-risk preset — any token, 5% slippage, CT degen persona             |
