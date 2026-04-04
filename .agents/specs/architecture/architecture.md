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
│         NestJS Backend               │
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

| Route        | Description                                             |
| ------------ | ------------------------------------------------------- |
| `/`          | Landing / login via Dynamic                             |
| `/onboard`   | One-time agent preset selection (Institutional / Degen) |
| `/dashboard` | Main chat interface + portfolio sidebar                 |

### Communication with Backend

- REST API calls for: sending prompts, fetching portfolio, managing orders
- WebSocket (or SSE) for: streaming Claude responses, real-time order status updates

---

## 2. Backend — NestJS (Self-hosted VPS)

### Purpose

Long-running process that handles AI reasoning, order management, Chainlink signal listening, and on-chain execution.

### Tech

- **Runtime:** Node.js
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** SQLite (dev) / Postgres (prod)
- **ORM:** TypeORM
- **Required packages:** `@nestjs/jwt`, `@nestjs/config`, `class-validator`, `class-transformer`
- No `@nestjs/passport` — unnecessary for single-strategy auth

### Core Modules

> Detail specs for implemented modules: [`backend-core-modules.md`](backend-core-modules.md)

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
  "title": "<short label for this strategy>",
  "reasoning": "<why this trade makes sense>",
  "token_in": "<symbol>",
  "token_out": "<symbol>",
  "trades": [
    {
      "type": "send" | "swap" | "limit_order",
      "amount_in": "<amount>",
      "expected_out": "<expected output amount>",
      "to": "<recipient address — only for send>",
      "slippage_tolerance": "<percentage>",
      "trading_price_usd": "<trigger price — only for limit_order>"
    }
  ]
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
| ------------- | -------------------------------- | -------------------------- |
| send | Immediate (user confirms) | Wallet transfer |
| swap | Immediate (user confirms) | Uniswap swap |
| limit_order | Price reaches trading_price_usd | Uniswap swap via CRE signal|

**Order lifecycle:**

```
pending → submitted → completed
                    → failed
        → cancelled  (proposal cancelled by user)
```

**Storage:** Orders stored in DB with: proposal ID, type, amount, recipient (send only), slippage, trigger price (limit only), tx hash, status, timestamps.

#### 2.3 PriceFeedModule — Chainlink CRE Integration

> ⚠️ **TBD — Integration pattern to be finalized.**

**Most likely approach:** CRE workflows that monitor price feeds and trigger callbacks when order conditions are met.

**Possible patterns:**

1. CRE pushes event/webhook to NestJS backend → backend executes order
2. CRE triggers on-chain function directly → smart contract executes swap
3. Backend polls CRE feeds on interval → checks order conditions locally

**For MVP:** Start with pattern 3 (polling) as fallback if CRE webhook setup is complex. Upgrade to pattern 1 for the demo.

**Data consumed:**

- Real-time price feeds (ETH/USD, BTC/USD, token/USD for any Uniswap-listed asset)
- Price change signals (% thresholds)
- Custom conditions defined per order

#### 2.4 ExecutionModule — Uniswap Execution Layer

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

#### 2.5 Dynamic SDK — Delegated Access

Dynamic uses MPC (multi-party computation) embedded wallets. Delegation lets the server sign transactions on behalf of the user without holding the full private key.

**Packages:**

- `@dynamic-labs-sdk/client` + `@dynamic-labs-sdk/client/waas` — client-side (Next.js)
- `@dynamic-labs-wallet/node` — server-side decryption
- `@dynamic-labs-wallet/node-evm` — server-side EVM signing

**Client-side (lazy trigger — first trade confirmation):**

```ts
import { getWalletAccounts } from "@dynamic-labs-sdk/client";
import {
  hasDelegatedAccess,
  delegateWaasKeyShares,
} from "@dynamic-labs-sdk/client/waas";

const walletAccount = getWalletAccounts()[0];
if (!hasDelegatedAccess({ walletAccount })) {
  await delegateWaasKeyShares({ walletAccount });
}
```

Called once — before the first `POST /api/orders/:id/confirm`. If delegation already exists (`hasDelegatedAccess` returns true), skip.

**Server-side webhook flow (`POST /api/webhooks/dynamic`):**

1. Verify HMAC-SHA256 signature via `x-dynamic-signature-256` header
2. Decrypt materials using `decryptDelegatedWebhookData` from `@dynamic-labs-wallet/node`
3. Encrypt `decryptedDelegatedShare` and `decryptedWalletApiKey` at rest (AES-256 with `DELEGATION_ENCRYPTION_KEY`)
4. Upsert into `delegations` table (keyed on `user_id`)

```ts
import { decryptDelegatedWebhookData } from "@dynamic-labs-wallet/node";

const { decryptedDelegatedShare, decryptedWalletApiKey } =
  decryptDelegatedWebhookData({
    privateKeyPem: process.env.DYNAMIC_RSA_PRIVATE_KEY,
    encryptedDelegatedKeyShare: webhookData.data.encryptedDelegatedShare,
    encryptedWalletApiKey: webhookData.data.encryptedWalletApiKey,
  });
```

**Server-side signing (ExecutionModule):**

```ts
import { createDelegatedEvmWalletClient } from "@dynamic-labs-wallet/node-evm";

const client = createDelegatedEvmWalletClient({
  environmentId: process.env.DYNAMIC_ENVIRONMENT_ID,
  apiKey: process.env.DYNAMIC_API_KEY,
});

// walletApiKey and keyShare are decrypted from DB at execution time
const signature = await client.signTransaction({
  walletId,
  walletApiKey,
  keyShare,
  transaction,
});
```

**Security:**

- Webhook endpoint has no JWT auth — uses HMAC-SHA256 verification only
- Delegation materials encrypted at rest before DB storage
- No plaintext key material ever stored

#### 2.6 ChatModule — WebSocket Gateway

Handles real-time communication between frontend and backend: order status updates. Depends on OrdersModule.

### Module Design Order

```
WalletModule → PriceFeedModule → OrdersModule → ExecutionModule
```

---

## 3. Database Schema (MVP)

### Relationships

```
users 1──∞ proposals 1──∞ orders
```

- A user has many proposals
- A proposal has many orders
- Delegation materials stored directly on the user row (no separate table)

### Tables

```sql
-- Users: Dynamic login identity + delegated signing authority
users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dynamic_id          TEXT UNIQUE NOT NULL,
  wallet_address      TEXT NOT NULL,
  email               TEXT,                     -- from Dynamic SDK (optional)
  preset              TEXT NOT NULL,            -- 'institutional' | 'degen'
  dynamic_wallet_id   TEXT,                     -- Dynamic walletId from delegation webhook (null until first trade)
  delegated_share     TEXT,                     -- AES-256 encrypted ServerKeyShare JSON (null until delegated)
  wallet_api_key      TEXT,                     -- AES-256 encrypted wallet API key (null until delegated)
  delegation_active   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMP DEFAULT NOW()
)

-- Proposals: Claude AI trading strategies confirmed by the user
proposals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,
  reasoning   TEXT NOT NULL,
  token_in    TEXT NOT NULL,
  token_out   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'accepted',  -- 'accepted' | 'declined' | 'cancelled'
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
)

-- Orders: individual trade executions linked to a proposal
orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id        UUID NOT NULL REFERENCES proposals(id),
  type               TEXT NOT NULL,              -- 'send' | 'swap' | 'limit_order'
  amount_in          TEXT NOT NULL,
  expected_out       TEXT,
  to                 TEXT,                       -- optional recipient address for 'send' orders
  slippage_tolerance TEXT,
  trading_price_usd  DECIMAL,                    -- null for send/swap; trigger price for limit_order
  confirmation_hash            TEXT,
  status             TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'submitted' | 'completed' | 'failed' | 'cancelled'
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
)
```

### Lifecycle

```
User.delegation_active: false → true (lazy — set on first trade confirmation via webhook)
Proposal: accepted → cancelled (user-initiated at any time)
Order:    pending → submitted → completed / failed
          pending | submitted → cancelled (when parent proposal is cancelled)
```

When a proposal is cancelled, all non-terminal orders are set to `cancelled`. Completed and failed orders are preserved as history.

---

## 4. API Routes

### NestJS Backend API

| Method | Route                       | Description                                                                                |
| ------ | --------------------------- | ------------------------------------------------------------------------------------------ |
| GET    | `/api/users?walletAddress=` | Look up user by wallet address. 200 + user profile if found, 404 if not. No auth required. |
| POST   | `/api/users`                 | Create user with wallet address + preset in one shot. No auth required.                    |
| POST   | `/api/chat`                  | Send message, get agent response. Requires JWT.                                            |
| GET    | `/api/portfolio`             | Wallet balances + token values                                                             |
| GET    | `/api/proposals`             | List user's proposals                                                                      |
| POST   | `/api/proposals`             | Create proposal + orders from confirmed strategy                                           |
| GET    | `/api/proposals/:id`         | Get single proposal                                                                        |
| GET    | `/api/proposals/:id/orders`  | List orders under a proposal                                                               |
| DELETE | `/api/proposals/:id`         | Cancel proposal and all active orders                                                      |
| GET    | `/api/prices`                | Current Chainlink price feeds                                                              |
| POST   | `/api/webhooks/dynamic`      | Receive Dynamic delegation webhook (no JWT — HMAC-SHA256 only)                             |

---

## 5. Auth Flow

```
New user:
1. User visits / → Dynamic SDK login (social / email)
2. Dynamic creates embedded wallet on Base
3. Frontend receives wallet address from Dynamic
4. Frontend calls GET /api/users?walletAddress= → 404 (no user)
5. Frontend redirects to /onboard
6. User selects preset and confirms
7. Frontend calls POST /api/users { walletAddress, preset }
8. Backend creates user in DB
9. Frontend redirects to /dashboard

Returning user:
1. User visits / → Dynamic SDK login (social / email)
2. Dynamic restores embedded wallet
3. Frontend receives wallet address from Dynamic
4. Frontend calls GET /api/users?walletAddress= → 200 + user profile
5. Frontend redirects to /dashboard

JWT (for proposal submission):
- Issued lazily when the user sends a proposal (POST /api/chat)
- Frontend sends Dynamic session token at that point to receive JWT
- JWT stored in memory, sent as Bearer token for all subsequent authenticated calls
```

---

## 6. Project Structure (Monorepo)

```
aiwal/
├── frontend/
│      ├── app/                # App Router pages
│      │   ├── page.tsx        # Landing / login
│      │   ├── onboard/        # Preset selection
│      │   └── chat/           # Chat + portfolio
│      ├── components/         # UI components
│      ├── lib/                # Client utilities
│      └── package.json
│
├── backend/
│       ├── src/
│       │   ├── main.ts         # NestJS bootstrap entry
│       │   ├── app.module.ts   # Root module
│       │   ├── common/         # CommonModule — guards, decorators, filters, interceptors
│       │   ├── auth/           # AuthModule — Dynamic SDK, JWT, login
│       │   ├── users/          # UsersModule — user CRUD, preset management
│       │   ├── wallet/         # WalletModule — Dynamic embedded wallet ops
│       │   ├── pricefeed/      # PriceFeedModule — Chainlink CRE price feeds
│       │   ├── orders/         # OrdersModule — proposals, order lifecycle
│       │   ├── execution/      # ExecutionModule — Uniswap swap execution
│       │   ├── chat/           # ChatModule — WebSocket gateway, streaming
│       │   └── db/             # TypeORM entities, migrations, config
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
DYNAMIC_WEBHOOK_SECRET=    # HMAC-SHA256 secret for webhook verification
DYNAMIC_RSA_PRIVATE_KEY=   # RSA private key for decrypting delegation materials
DELEGATION_ENCRYPTION_KEY= # AES-256 key for at-rest encryption of delegation data
JWT_SECRET=                # Secret for signing JWTs
JWT_EXPIRATION=4h          # JWT token TTL
CHAINLINK_CRE_*=          # TBD based on integration
UNISWAP_API_KEY=           # If required
DATABASE_URL=
BASE_RPC_URL=
FRONTEND_URL=              # For CORS
```

---

## 8. Open Items

- [ ] Chainlink CRE integration pattern — webhook vs polling vs on-chain trigger
- [ ] Styling framework — Tailwind vs other
- [ ] WebSocket vs SSE for streaming responses
- [ ] Rate limiting / security hardening for API
- [ ] Styling framework — Tailwind vs other
- [ ] WebSocket vs SSE for streaming responses
- [ ] Rate limiting / security hardening for API
