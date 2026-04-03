# Aiwal — Architecture Spec

> ETHGlobal Cannes 2026 · MVP · April 2026

---

## System Overview

```
┌──────────────────────────────────────┐
│         Next.js Frontend             │
│         (Vercel)                     │
│                                      │
│  ┌────────────┐  ┌───────────────┐   │
│  │  Chat UI   │  │ Portfolio     │   │
│  │            │  │ View          │   │
│  └─────┬──────┘  └───────┬───────┘   │
│        │                 │           │
│  ┌─────▼─────────────────▼───────┐   │
│  │  Transaction Confirmation     │   │
│  │  Modal                        │   │
│  └───────────────┬───────────────┘   │
└──────────────────┼───────────────────┘
                   │ REST / WebSocket
┌──────────────────▼───────────────────┐
│         Express Backend              │
│         (Self-hosted VPS)            │
│                                      │
│  ┌─────────────┐  ┌──────────────┐   │
│  │ Claude API  │  │ Order Engine │   │
│  │ (Context    │  │ (Limit, SL,  │   │
│  │  Injection) │  │  TP, Market) │   │
│  └──────┬──────┘  └──────┬───────┘   │
│         │                │           │
│  ┌──────▼──────┐  ┌──────▼───────┐   │
│  │ Dynamic SDK │  │ Chainlink    │   │
│  │ (Server)    │  │ CRE Listener │   │
│  └──────┬──────┘  └──────┬───────┘   │
│         │                │           │
│  ┌──────▼────────────────▼───────┐   │
│  │  Uniswap Execution Layer      │   │
│  └───────────────┬───────────────┘   │
│                  │                   │
│  ┌───────────────▼───────────────┐   │
│  │  Database (SQLite / Postgres) │   │
│  └───────────────────────────────┘   │
└──────────────────┼───────────────────┘
                   │
          ┌────────▼────────┐
          │    Base L2       │
          │    (On-chain)    │
          └─────────────────┘
```

---

## 1. Frontend — Next.js (Vercel)

### Purpose

Serves the user-facing UI: chat interface, portfolio view, and transaction confirmation.

### Tech

- **Framework:** Next.js (App Router)
- **Hosting:** Vercel
- **Styling:** TBD (Tailwind recommended for speed)
- **Auth:** Dynamic SDK (client-side) — social login, embedded wallet creation

### Pages / Views

| Route      | Description                                             |
| ---------- | ------------------------------------------------------- |
| `/`        | Landing / login via Dynamic                             |
| `/onboard` | One-time agent preset selection (Institutional / Degen) |
| `/chat`    | Main chat interface + portfolio sidebar                 |

### Communication with Backend

- REST API calls for: sending prompts, fetching portfolio, managing orders
- WebSocket (or SSE) for: streaming Claude responses, real-time order status updates

---

## 2. Backend — Express (Self-hosted VPS)

### Purpose

Long-running process that handles AI reasoning, order management, Chainlink signal listening, and on-chain execution.

### Tech

- **Runtime:** Node.js
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** SQLite (dev) / Postgres (prod)
- **ORM:** TypeORM

### Core Modules

#### 2.1 AI Agent (Claude API — Context Injection)

The agent uses context injection rather than tool use. On each user message, the backend assembles a context bundle and sends it to Claude.

**System prompt structure:**

```
[Trading Profile]
Preset: Degen
Risk tolerance: High
Allowed tokens: Any on Uniswap Base

[Wallet State]
Address: 0x...
Balances:
- 2.5 ETH ($4,500)
- 1,200 USDC
- 0.05 WBTC ($3,100)

[Open Orders]
- Limit: Buy 1 ETH @ $1,700 (status: pending)
- Stop Loss: Sell 0.5 ETH if price < $1,600 (status: active)

[Market Data — Chainlink CRE]
ETH/USD: $1,812.50 (24h: -2.3%)
BTC/USD: $62,100.00 (24h: +0.8%)
USDC/USD: $1.00

[Instructions]
You are the Aiwal trading agent. Based on the user's profile and current state,
respond to their request with one of:
1. A structured transaction proposal (JSON)
2. An informational response
3. A clarifying question

Transaction proposal format:
{
  "type": "swap" | "limit_order" | "stop_loss" | "take_profit",
  "action": "buy" | "sell",
  "token_in": "<symbol>",
  "token_out": "<symbol>",
  "amount_in": "<amount>",
  "expected_out": "<amount>",
  "slippage_tolerance": "<percentage>",
  "condition": "<price condition if limit/SL/TP>",
  "gas_estimate": "<estimate>",
  "reasoning": "<why this trade makes sense>"
}
```

**Flow:**

1. User sends message via frontend
2. Backend fetches: wallet balances, open orders, latest Chainlink feeds
3. Backend assembles system prompt + user message
4. Sends to Claude API
5. Parses response — if transaction proposal, sends to frontend for confirmation
6. If confirmed, routes to execution layer

#### 2.2 Order Engine

Manages all order types and their lifecycle.

**Order types:**
| Type | Trigger | Execution |
| ------------ | -------------------------------- | -------------------------- |
| Market Swap | Immediate (user confirms) | Uniswap swap |
| Limit Order | Price reaches target | Uniswap swap via CRE signal|
| Stop Loss | Price drops below threshold | Uniswap swap via CRE signal|
| Take Profit | Price rises above threshold | Uniswap swap via CRE signal|

**Order lifecycle:**

```
CREATED → PENDING → TRIGGERED → EXECUTING → COMPLETED
                                          → FAILED
                  → CANCELLED
```

**Storage:** Orders stored in DB with: user ID, type, params, condition, status, timestamps, tx hash.

#### 2.3 Chainlink CRE Integration

> ⚠️ **TBD — Integration pattern to be finalized.**

**Most likely approach:** CRE workflows that monitor price feeds and trigger callbacks when order conditions are met.

**Possible patterns:**

1. CRE pushes event/webhook to Express backend → backend executes order
2. CRE triggers on-chain function directly → smart contract executes swap
3. Backend polls CRE feeds on interval → checks order conditions locally

**For MVP:** Start with pattern 3 (polling) as fallback if CRE webhook setup is complex. Upgrade to pattern 1 for the demo.

**Data consumed:**

- Real-time price feeds (ETH/USD, BTC/USD, token/USD for any Uniswap-listed asset)
- Price change signals (% thresholds)
- Custom conditions defined per order

#### 2.4 Uniswap Execution Layer

Executes swaps on Base via the Uniswap API.

**Capabilities:**

- Route finding (optimal path across pools)
- Slippage estimation
- Gas estimation
- Swap execution via the embedded wallet's delegated access

**Flow:**

1. Receive swap params (token_in, token_out, amount, slippage)
2. Call Uniswap API for quote + route
3. Build transaction
4. Sign via Dynamic SDK delegated access (server-side)
5. Submit to Base
6. Monitor tx confirmation
7. Update order status in DB

**Token scope:** Any token available on Uniswap Base pools. No whitelist restriction for MVP.

#### 2.5 Dynamic SDK (Server-side)

- Manages embedded wallets with delegated access
- Server holds delegated signing authority for autonomous execution (CRE-triggered orders)
- User retains full ownership; delegation is scoped

---

## 3. Database Schema (MVP)

> Full spec: `.agents/specs/architecture/persistence-layer.md`

```
users 1──∞ proposals 1──1 delegations
                     1──∞ orders
```

```sql
-- Users: Dynamic login identity
users (
  id              UUID PRIMARY KEY,
  dynamic_id      TEXT UNIQUE NOT NULL,
  wallet_address  TEXT NOT NULL,
  preset          TEXT NOT NULL,            -- 'institutional' | 'degen'
  created_at      TIMESTAMP
)

-- Proposals: parsed Claude AI transaction proposals
proposals (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id),
  type            TEXT NOT NULL,            -- 'market' | 'limit' | 'stop_loss' | 'take_profit'
  action          TEXT NOT NULL,            -- 'buy' | 'sell'
  token_in        TEXT NOT NULL,
  token_out       TEXT NOT NULL,
  amount_in       TEXT NOT NULL,
  expected_out    TEXT,
  slippage        TEXT,
  condition       TEXT,                     -- JSON: price condition for limit/SL/TP
  status          TEXT NOT NULL DEFAULT 'confirmed',  -- 'confirmed' | 'completed' | 'failed'
  created_at      TIMESTAMP,
  updated_at      TIMESTAMP
)

-- Delegations: Dynamic SDK delegated signing (1:1 with proposal)
delegations (
  id              UUID PRIMARY KEY,
  proposal_id     UUID UNIQUE NOT NULL REFERENCES proposals(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  delegation_data TEXT,                     -- JSON: Dynamic SDK payload (TBD)
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP,
  revoked_at      TIMESTAMP
)

-- Orders: Uniswap swap executions linked to a proposal
orders (
  id              UUID PRIMARY KEY,
  proposal_id     UUID NOT NULL REFERENCES proposals(id),
  tx_hash         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'executing' | 'completed' | 'failed'
  created_at      TIMESTAMP,
  updated_at      TIMESTAMP
)
```

---

## 4. API Routes

### Express Backend API

| Method | Route                     | Description                            |
| ------ | ------------------------- | -------------------------------------- |
| POST   | `/api/chat`               | Send message, get agent response       |
| GET    | `/api/portfolio`          | Wallet balances + token values         |
| GET    | `/api/orders`             | List user's orders                     |
| POST   | `/api/orders`             | Create order (from confirmed proposal) |
| DELETE | `/api/orders/:id`         | Cancel an order                        |
| POST   | `/api/orders/:id/confirm` | Confirm and execute a proposal         |
| GET    | `/api/prices`             | Current Chainlink price feeds          |
| POST   | `/api/auth/session`       | Validate Dynamic session               |

---

## 5. Auth Flow

```
1. User visits frontend → Dynamic SDK login (social / email)
2. Dynamic creates embedded wallet on Base
3. Frontend receives session token
4. Frontend sends session token with all API calls
5. Backend validates session via Dynamic SDK (server-side)
6. Backend stores user + wallet mapping in DB
7. Delegated access granted to backend for autonomous execution
```

---

## 6. Project Structure (Monorepo)

```
aiwal/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App Router pages
│   │   │   ├── page.tsx        # Landing / login
│   │   │   ├── onboard/        # Preset selection
│   │   │   └── chat/           # Chat + portfolio
│   │   ├── components/         # UI components
│   │   ├── lib/                # Client utilities
│   │   └── package.json
│   │
│   └── server/                 # Express backend
│       ├── src/
│       │   ├── index.ts        # Express app entry
│       │   ├── routes/         # API route handlers
│       │   ├── agent/          # Claude API integration + context builder
│       │   ├── orders/         # Order engine + lifecycle
│       │   ├── chainlink/      # CRE listener / poller
│       │   ├── uniswap/        # Swap execution
│       │   ├── auth/           # Dynamic SDK server-side
│       │   └── db/             # Schema + migrations
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types, constants
│       ├── types.ts            # Order types, API types, presets
│       └── package.json
│
├── package.json                # Workspace root
├── ERP.md
├── ARCHITECTURE.md
└── CLAUDE.md
```

---

## 7. Deployment

| Component | Platform        | Notes                                    |
| --------- | --------------- | ---------------------------------------- |
| Frontend  | Vercel          | Auto-deploy from main branch             |
| Backend   | Self-hosted VPS | PM2 or Docker, persistent process needed |
| Database  | VPS (SQLite)    | Same host as backend for MVP             |

**Environment variables (backend):**

```
CLAUDE_API_KEY=
DYNAMIC_API_KEY=
DYNAMIC_ENVIRONMENT_ID=
CHAINLINK_CRE_*=          # TBD based on integration
UNISWAP_API_KEY=           # If required
DATABASE_URL=
BASE_RPC_URL=
FRONTEND_URL=              # For CORS
```

---

## 8. Open Items

- [ ] Chainlink CRE integration pattern — webhook vs polling vs on-chain trigger
- [x] ORM choice — TypeORM with SQLite (dev) / Postgres (prod)
- [ ] Styling framework — Tailwind vs other
- [ ] WebSocket vs SSE for streaming responses
- [ ] Rate limiting / security hardening for API
- [ ] Delegated access scope + transaction limits per preset
