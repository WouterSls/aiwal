# Specs Overview

## Architecture

| Spec                                                              | Status   | Description                                                              |
| ----------------------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| [architecture.md](architecture/architecture.md)                         | NOT DONE | System architecture — frontend, backend, modules, deployment             |
| [backend-architecture.md](architecture/backend-architecture.md)         | NOT DONE | Express backend — TypeScript, Drizzle/SQLite, Zod, API key auth, route map |
| [backend-core-modules.md](architecture/backend-core-modules.md)         | OUTDATED | NestJS module map — superseded by backend-architecture.md                |
| [persistence-layer.md](architecture/persistence-layer.md)               | OUTDATED | TypeORM schema — superseded by backend-architecture.md (Drizzle)         |

## Backend Modules

| Spec | Status | Description |
|------|--------|-------------|
| [common-module.md](backend/common-module.md) | NOT DONE | CommonModule — guards, decorators, DTOs, interceptors, error handling |
| [auth-module.md](backend/auth-module.md) | NOT DONE | AuthModule — Dynamic SDK session validation, JWT issuance, global AuthGuard |
| [users-module.md](backend/users-module.md) | NOT DONE | UsersModule — user CRUD, preset management, wallet mapping, abstract repository |
| [wallet-module.md](backend/wallet-module.md) | NOT DONE | WalletModule — Dynamic delegation webhook, AES-256 at-rest encryption, delegation material access |
| [pricefeed-module.md](backend/pricefeed-module.md) | NOT DONE | PriceFeedModule — Uniswap Quoter API prices, Base block listener, order condition monitoring |
| [orders-module.md](backend/orders-module.md) | NOT DONE | OrdersModule — proposal + order CRUD, market/conditional dispatch, EventEmitter2 execution handoff |
| [execution-module.md](backend/execution-module.md) | NOT DONE | ExecutionModule — Dynamic delegated wallet, Uniswap swap execution, order.execute event handler |

## Frontend

| Spec                                                                        | Status   | Description                                                                                                        |
| --------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| [frontend-architecture.md](architecture/frontend-architecture.md)           | NOT DONE | Next.js frontend — Tailwind/shadcn, React Query, WebSocket streaming, 50/50 chat+portfolio layout, proposal editor |
| [frontend-folder-setup.md](frontend/frontend-folder-setup.md)               | NOT DONE | Frontend scaffolding — flat root `frontend/`, Next.js 16 JS, independent packages, dev workflow                    |
| [design.md](frontend/design.md)                                             | NOT DONE | Design system — visual language, color palette, typography, component guidelines                                    |
| [landing-page.md](frontend/landing-page.md)                                 | NOT DONE | Landing page — `/` route, hero section, CTA, layout                                                                |
| [header.md](frontend/header.md)                                             | NOT DONE | Header — persistent site header across all routes                                                                   |
| [connect-button.md](frontend/connect-button.md)                             | NOT DONE | Connect button — Dynamic JS SDK auth, email OTP + social login via custom modal                                     |
| [dashboard.md](frontend/dashboard.md)                                       | NOT DONE | Dashboard — `/dashboard` route, 50/50 chat+portfolio layout, proposal editor, proposals history                     |
| [onboard-page.md](frontend/onboard-page.md)                                 | NOT DONE | Onboard page — `/onboard` route, one-time preset selection for new users                                            |
| [footer.md](frontend/footer.md)                                             | NOT DONE | Footer — landing page only, multi-column editorial footer                                                           |
| [legal-pages.md](frontend/legal-pages.md)                                   | NOT DONE | Legal pages — `/privacy` and `/terms` routes                                                                        |

## LLM Context Integration

| Spec                                                                   | Status   | Description                                                                                            |
| ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| [claude-interaction.md](llm-context-integration/claude-interaction.md) | NOT DONE | Claude API interaction — frontend-direct calls, context assembly, response parsing, proposal detection |

## Agent Presets

| Spec                                                             | Status   | Description                                                             |
| ---------------------------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| [institutional-preset.md](agent-presets/institutional-preset.md) | NOT DONE | Low-risk preset — whitelist tokens, 0.3% slippage, risk-analyst persona |
| [degen-preset.md](agent-presets/degen-preset.md)                 | NOT DONE | High-risk preset — any token, 5% slippage, CT degen persona             |
