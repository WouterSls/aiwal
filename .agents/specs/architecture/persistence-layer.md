# Persistence Layer Spec

> Aiwal MVP — SQLite (dev) / Postgres (prod) via TypeORM

---

## Overview

Three-table schema powering the Aiwal backend. Users authenticate via Dynamic, create trading strategies through Claude AI, and execute trades as individual orders linked to a proposal.

## Purpose

Define the database schema, entity relationships, and TypeORM types for the persistence layer.

## Schema

### Relationships

```
users 1──∞ proposals 1──∞ orders
```

- A user has many proposals
- A proposal has many orders
- Delegation materials are stored directly on the user row (1:1, no separate table)

### TypeScript Interfaces

```ts
enum OrderType {
  Send = 'send',
  Swap = 'swap',
  LimitOrder = 'limit_order',
}

enum ProposalStatus {
  Accepted = 'accepted',
  Declined = 'declined',
  Cancelled = 'cancelled',
}

enum OrderStatus {
  Pending = 'pending',
  Submitted = 'submitted',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export interface Trade {
  type: OrderType;
  amount_in: string;
  expected_out?: string;
  to?: string;
  slippage_tolerance?: string;
  trading_price_usd?: number;
}

export interface TradingStrategy {
  title: string;
  reasoning: string;
  token_in: string;
  token_out: string;
  trades: Trade[];
}
```

### Tables

```sql
-- Users: Dynamic login identity + delegated signing authority
users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dynamic_id        TEXT UNIQUE NOT NULL,
  wallet_address    TEXT NOT NULL,
  preset            TEXT,             -- 'institutional' | 'degen' | null until onboarding complete
  dynamic_wallet_id TEXT,             -- Dynamic walletId from delegation webhook (null until first trade)
  delegated_share   TEXT,             -- AES-256 encrypted ServerKeyShare JSON (null until delegated)
  wallet_api_key    TEXT,             -- AES-256 encrypted wallet API key (null until delegated)
  delegation_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMP DEFAULT NOW()
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
Proposal:  accepted → cancelled (user-initiated at any time)
Order:     pending → submitted → completed / failed
           pending → cancelled (when parent proposal is cancelled)
           submitted → cancelled (when parent proposal is cancelled)
```

When a proposal is cancelled, all orders in a non-terminal state (`pending`, `submitted`) are set to `cancelled`. Orders already in `completed` or `failed` are preserved as history.

## TypeORM Notes

- `users.delegated_share` and `users.wallet_api_key` must be encrypted/decrypted in the service layer, never stored plaintext
- User row updated (not inserted) on webhook delivery — use `eventId` as idempotency key if replays are needed
- Proposal cancellation cascade is handled in the service layer, not via DB-level ON DELETE CASCADE

## Tasks

- [ ] Create TypeORM entities for all 3 tables in `apps/server/src/db/`
- [ ] Create shared types in `packages/shared/types.ts` (enums for status, type)
- [ ] Set up SQLite TypeORM connection config
- [ ] Add migration for initial schema