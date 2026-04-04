# Backend Architecture Spec

> Aiwal MVP — Express + TypeScript on self-hosted VPS

---

## Overview

Express API server with feature-based routing, Drizzle ORM over SQLite, and Zod validation. API key auth between frontend and backend. Handles AI context assembly, order lifecycle, Chainlink price feeds, and Uniswap execution.

## Purpose

Define the backend folder structure, module map, middleware, API routes, database schema, and integration points with the frontend and external services.

---

## Tech Stack

| Concern           | Choice                                                                                |
| ----------------- | ------------------------------------------------------------------------------------- |
| Runtime           | Node.js                                                                               |
| Framework         | Express                                                                               |
| Language          | TypeScript                                                                            |
| Database          | SQLite                                                                                |
| ORM               | Drizzle ORM + drizzle-kit                                                             |
| Validation        | Zod                                                                                   |
| Auth              | API key middleware (frontend ↔ backend)                                               |
| Wallet delegation | Dynamic Javascript SDK (`@dynamic-labs-wallet/node`, `@dynamic-labs-wallet/node-evm`) |
| Hosting           | Self-hosted VPS                                                                       |

---

import { getWalletAccounts } from '@dynamic-labs-sdk/client';
import { hasDelegatedAccess } from '@dynamic-labs-sdk/client/waas';

## File Structure

```
backend/
├── src/
│   ├── server.ts               # HTTP server bootstrap (port, listen)
│   ├── app.ts                  # Express app setup (middleware, routes)
│   ├── app/
│   │   ├── users/
│   │   │   └── users.router.ts
│   │   ├── auth/
│   │   │   └── auth.router.ts
│   │   ├── portfolio/
│   │   │   └── portfolio.router.ts
│   │   ├── prices/
│   │   │   └── prices.router.ts
│   │   ├── orders/
│   │   │   └── orders.router.ts
│   │   ├── proposals/
│   │   │   └── proposals.router.ts
│   │   └── webhooks/
│   │       └── webhooks.router.ts
│   └── lib/
│       ├── api-key.middleware.ts   # API key auth — applied globally in app.ts
│       ├── db.ts                   # Drizzle client + SQLite connection
│       ├── schema.ts               # Drizzle schema (tables, types)
│       ├── dynamic.ts              # Dynamic SDK server-side client
│       ├── uniswap.ts              # Uniswap API client (quotes, swap execution)
│       └── pricefeed.ts            # Chainlink CRE price feed client
├── drizzle/
│   └── migrations/                 # drizzle-kit generated migrations
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

---

## App Setup

### `server.ts`

Bootstrap only — imports app, starts HTTP server on configured port.

### `app.ts`

- `express.json()` middleware
- API key middleware from `lib/api-key.middleware.ts` applied globally (except `POST /api/webhooks/dynamic` which uses HMAC-SHA256 only)
- Mounts all routers under `/api`

---

## Auth

### API Key Middleware (`lib/api-key.middleware.ts`)

Simple header check applied globally.

```
x-api-key: <INTERNAL_API_KEY>
```

- Returns `401` if missing or invalid
- `POST /api/webhooks/dynamic` is excluded — uses Dynamic HMAC-SHA256 signature verification instead
- Public routes (`GET /api/users?walletAddress=`, `POST /api/users`) are also excluded (called before JWT exists)

---

## Routes

| Method | Route                       | Auth        | Description                                                                   |
| ------ | --------------------------- | ----------- | ----------------------------------------------------------------------------- |
| GET    | `/api/users?walletAddress=` | None        | Look up user by wallet address. 200 + user if found, 404 if not               |
| POST   | `/api/users`                | None        | Create user with `{ walletAddress, preset }`                                  |
| POST   | `/api/auth/session`         | None        | Validate Dynamic session token, return internal token or session confirmation |
| GET    | `/api/portfolio`            | API key     | Wallet token balances                                                         |
| GET    | `/api/prices`               | API key     | Current Chainlink price feeds                                                 |
| GET    | `/api/orders`               | API key     | List user's orders                                                            |
| POST   | `/api/orders`               | API key     | Create order from confirmed proposal                                          |
| DELETE | `/api/orders/:id`           | API key     | Cancel a pending order                                                        |
| POST   | `/api/orders/:id/confirm`   | API key     | Trigger delegation (if needed) + execute swap                                 |
| POST   | `/api/webhooks/dynamic`     | HMAC-SHA256 | Receive Dynamic delegation webhook                                            |

---

## Database Schema

### Relationships

```
users 1──∞ proposals 1──∞ orders
```

### Drizzle Schema (`lib/schema.ts`)

```ts
users {
  id                UUID PK
  dynamic_id        TEXT UNIQUE NOT NULL
  wallet_address    TEXT NOT NULL
  preset            TEXT NOT NULL           // 'institutional' | 'degen'
  dynamic_wallet_id TEXT                   // null until first trade
  delegated_share   TEXT                   // AES-256 encrypted, null until delegated
  wallet_api_key    TEXT                   // AES-256 encrypted, null until delegated
  delegation_active BOOLEAN DEFAULT false
  created_at        TIMESTAMP
}

proposals {
  id           UUID PK
  user_id      UUID FK → users.id
  type         TEXT NOT NULL              // 'market' | 'limit' | 'stop_loss' | 'take_profit'
  action       TEXT NOT NULL             // 'buy' | 'sell'
  token_in     TEXT NOT NULL
  token_out    TEXT NOT NULL
  amount_in    TEXT NOT NULL
  expected_out TEXT
  slippage     TEXT
  condition    TEXT                      // JSON string: price condition for limit/SL/TP
  status       TEXT DEFAULT 'confirmed'  // 'confirmed' | 'completed' | 'failed'
  created_at   TIMESTAMP
  updated_at   TIMESTAMP
}

orders {
  id          UUID PK
  proposal_id UUID FK → proposals.id
  tx_hash     TEXT
  status      TEXT DEFAULT 'pending'    // 'pending' | 'executing' | 'completed' | 'failed'
  created_at  TIMESTAMP
  updated_at  TIMESTAMP
}
```

### Lifecycle

```
User.delegation_active: false → true  (set on first trade via Dynamic webhook)
Proposal:              confirmed → completed / failed
Order:                 pending → executing → completed / failed
```

When all orders under a proposal reach terminal state, proposal status updates.

---

## Integration Points

### Dynamic SDK — Wallet Delegation

**Webhook (`POST /api/webhooks/dynamic`):**

1. Verify `x-dynamic-signature-256` HMAC-SHA256 header
2. Decrypt materials via `decryptDelegatedWebhookData` from `@dynamic-labs-wallet/node`
3. Encrypt `decryptedDelegatedShare` and `decryptedWalletApiKey` at rest (AES-256, `DELEGATION_ENCRYPTION_KEY`)
4. Upsert into `users` row

**Execution signing:**

```ts
import { createDelegatedEvmWalletClient } from "@dynamic-labs-wallet/node-evm";

const client = createDelegatedEvmWalletClient({
  environmentId: process.env.DYNAMIC_ENVIRONMENT_ID,
  apiKey: process.env.DYNAMIC_API_KEY,
});

await client.signTransaction({ walletId, walletApiKey, keyShare, transaction });
```

### Chainlink CRE — Price Feeds (`lib/pricefeed.ts`)

- Polls price feeds on interval for `GET /api/prices`
- Monitors active limit/SL/TP order conditions — triggers execution when met
- **MVP:** polling pattern; upgrade to webhook/push pattern post-MVP

### Uniswap — Swap Execution (`lib/uniswap.ts`)

1. Receive swap params (token_in, token_out, amount, slippage)
2. Call Uniswap API for quote + route
3. Build transaction
4. Sign via Dynamic delegated wallet client
5. Submit to Base
6. Monitor confirmation → update order status in DB

---

## Environment Variables

```
INTERNAL_API_KEY=             # Shared secret between frontend and backend
DYNAMIC_API_KEY=
DYNAMIC_ENVIRONMENT_ID=
DYNAMIC_WEBHOOK_SECRET=       # HMAC-SHA256 secret for webhook verification
DYNAMIC_RSA_PRIVATE_KEY=      # RSA private key for decrypting delegation materials
DELEGATION_ENCRYPTION_KEY=    # AES-256 key for at-rest encryption of delegation data
DATABASE_URL=                 # SQLite file path
BASE_RPC_URL=
UNISWAP_API_KEY=
CHAINLINK_CRE_API_KEY=
FRONTEND_URL=                 # CORS origin
PORT=3001
```

---

## Deployment

| Component | Platform        | Notes                        |
| --------- | --------------- | ---------------------------- |
| Backend   | Self-hosted VPS | PM2 or Docker                |
| Database  | VPS (SQLite)    | Same host as backend for MVP |

---

## Tasks

- [ ] Scaffold Express app in `backend/` with TypeScript
- [ ] Set up `server.ts` + `app.ts` with global middleware
- [ ] Implement API key middleware in `lib/api-key.middleware.ts`
- [ ] Configure Drizzle ORM + SQLite in `lib/db.ts` + `lib/schema.ts`
- [ ] Run drizzle-kit to generate initial migration
- [ ] Build `users` router — `GET /api/users` + `POST /api/users`
- [ ] Build `auth` router — `POST /api/auth/session` with Dynamic session validation
- [ ] Build `portfolio` router — `GET /api/portfolio`
- [ ] Build `prices` router — `GET /api/prices` backed by `lib/pricefeed.ts`
- [ ] Build `orders` router — full CRUD + confirm flow
- [ ] Build `webhooks` router — HMAC-SHA256 verification + delegation upsert
- [ ] Implement `lib/dynamic.ts` — server-side Dynamic SDK client
- [ ] Implement `lib/uniswap.ts` — quote + execution
- [ ] Implement `lib/pricefeed.ts` — Chainlink CRE polling + condition monitor
