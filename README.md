# Aiwal — AI Wallet

> ETHGlobal Cannes 2026 · MVP

A next-generation web3 wallet that enables onchain automation. Users deposit assets, set a trading profile, and interact via natural language. The context-aware AI proposes on-chain transactions or strategies, which the user confirms. Chainlink CRE feeds real-time market intelligence into the agent's reasoning loop and the backend trigger mechanism, while all execution happens on-chain via Uniswap on Base.

---

## Features

- **Natural language trading** — chat with an AI agent to propose swaps, limit orders, stop-losses, and take-profits
- **Context-aware reasoning** — agent has full visibility into wallet balances, open orders, and live Chainlink price feeds
- **Trading profiles** — Institutional (low risk, stable pools) or Degen (high risk tolerance, any token)
- **Smart account wallet** — Dynamic SDK onboarding with embedded wallets on Base, no seed phrase friction
- **On-chain execution** — Uniswap API routing with slippage and gas estimation

---

## Tech Stack

| Layer       | Technology                                    |
| ----------- | --------------------------------------------- |
| Frontend    | Next.js (App Router), Tailwind CSS, shadcn/ui |
| Backend     | NestJS, TypeScript, TypeORM                   |
| AI          | Claude API (context injection)                |
| Wallet      | Dynamic SDK (embedded wallets, social login)  |
| Market data | Chainlink CRE price feeds                     |
| Execution   | Uniswap API on Base                           |
| Database    | SQLite (dev) / Postgres (prod)                |
| Hosting     | Vercel (frontend) + VPS (backend)             |

---

## Project Structure

```
aiwal/
├── frontend/          # Next.js frontend
├── backend/           # NestJS backend
└── .agents/specs/     # Architecture and feature specs
```

---

## Pages

| Route        | Description                               |
| ------------ | ----------------------------------------- |
| `/`          | Landing page — connect wallet via Dynamic |
| `/onboard`   | One-time trading profile selection        |
| `/dashboard` | Chat interface + portfolio view           |

---

## User Flow

1. **Connect** — social login or email OTP via Dynamic SDK, embedded wallet created on Base
2. **Select profile** — Institutional or Degen preset seeds the AI context
3. **Chat** — natural language prompts to the agent (e.g. _"Rotate 30% of my ETH into stables"_)
4. **Confirm** — review the structured transaction proposal (swap params, slippage, gas estimate)
5. **Execute** — smart account signs and submits on-chain via Uniswap

---

## Backend Modules

```
WalletModule → PriceFeedModule → OrdersModule → ExecutionModule → AgentModule → ChatModule
```

| Module          | Responsibility                               |
| --------------- | -------------------------------------------- |
| AuthModule      | Dynamic SDK session validation, JWT issuance |
| UsersModule     | User CRUD, preset management                 |
| WalletModule    | Dynamic embedded wallet operations           |
| PriceFeedModule | Chainlink CRE price feeds                    |
| OrdersModule    | Proposals, order lifecycle management        |
| ExecutionModule | Uniswap swap execution                       |
| AgentModule     | Claude API, context injection                |
| ChatModule      | WebSocket gateway, response streaming        |

---

## Order Types

| Type        | Trigger                        |
| ----------- | ------------------------------ |
| Market Swap | Immediate on user confirmation |
| Limit Order | Price reaches target           |
| Stop Loss   | Price drops below threshold    |
| Take Profit | Price rises above threshold    |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Environment Variables

**Backend** (`.env`):

```
CLAUDE_API_KEY=
DYNAMIC_API_KEY=
DYNAMIC_ENVIRONMENT_ID=
JWT_SECRET=
JWT_EXPIRATION=4h
DATABASE_URL=
BASE_RPC_URL=
FRONTEND_URL=
```

**Frontend** (`.env.local`):

```
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=
NEXT_PUBLIC_API_URL=
```

### Install & Run

```bash
# Install dependencies
pnpm install

# Run frontend
cd frontend && pnpm dev

# Run backend
cd backend && pnpm dev
```

---

## Trading Profiles

**Institutional** — conservative preset for risk-managed execution. Whitelisted tokens (ETH, BTC, USDC, USDT, DAI), max 0.3% slippage, stability-focused reasoning.

**Degen** — high-risk preset for aggressive trading. Any Uniswap-listed token, up to 5% slippage, CT-native tone and reasoning style.

---

Built for ETHGlobal Cannes 2026.
