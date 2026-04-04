# Persistence Layer Spec

> Aiwal MVP — SQLite (dev) / Postgres (prod) via TypeORM

---

## Overview

Four-table schema powering the Aiwal backend. Users authenticate via Dynamic, create proposals through Claude AI, delegate signing authority per proposal, and execute orders via Uniswap.

## Purpose

Define the database schema, entity relationships, and TypeORM types for the persistence layer. This spec replaces the preliminary schema in the architecture spec.

## Schema

### Relationships

```
users 1──∞ proposals 1──∞ orders
```

- A user has many proposals
- A proposal has many orders
- Delegation materials are stored directly on the user row (1:1, no separate table)

### Tables

```sql
-- Users: Dynamic login identity + delegated signing authority
users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dynamic_id          TEXT UNIQUE NOT NULL,
  wallet_address      TEXT NOT NULL,
  preset              TEXT,                     -- 'institutional' | 'degen' | null until onboarding complete
  dynamic_wallet_id   TEXT,                     -- Dynamic walletId from delegation webhook (null until first trade)
  delegated_share     TEXT,                     -- AES-256 encrypted ServerKeyShare JSON (null until delegated)
  wallet_api_key      TEXT,                     -- AES-256 encrypted wallet API key (null until delegated)
  delegation_active   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMP DEFAULT NOW()
)

-- Proposals: parsed Claude AI transaction proposals
proposals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  type            TEXT NOT NULL,            -- 'market' | 'limit' | 'stop_loss' | 'take_profit'
  action          TEXT NOT NULL,            -- 'buy' | 'sell'
  token_in        TEXT NOT NULL,
  token_out       TEXT NOT NULL,
  amount_in       TEXT NOT NULL,            -- string for precision
  expected_out    TEXT,
  slippage        TEXT,
  condition       TEXT,                     -- JSON: price condition for limit/SL/TP
  status          TEXT NOT NULL DEFAULT 'confirmed',  -- 'confirmed' | 'completed' | 'failed'
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
)

-- Orders: Uniswap API swap executions linked to a proposal
orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id),
  tx_hash         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'executing' | 'completed' | 'failed'
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
)
```

### Lifecycle

```
User.delegation_active: false → true (lazy — set on first trade confirmation via webhook)
Proposal:               confirmed → completed (all orders done) / failed
Order:                  pending → executing → completed / failed
```

When all orders under a proposal reach a terminal state (completed/failed), the proposal status updates accordingly.

## TypeORM Notes

- `users.delegated_share` and `users.wallet_api_key` must be encrypted/decrypted in the service layer, never stored plaintext
- User row updated (not inserted) on webhook delivery — use `eventId` as idempotency key if replays are needed

## Tasks

- [ ] Create TypeORM entities for all 3 tables in `apps/server/src/db/`
- [ ] Create shared types in `packages/shared/types.ts` (enums for status, type, action)
- [ ] Set up SQLite TypeORM connection config
- [ ] Add migration for initial schema
