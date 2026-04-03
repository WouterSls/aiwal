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
users 1──∞ proposals 1──1 delegations
                     1──∞ orders
```

- A user has many proposals
- A proposal has exactly one delegation
- A proposal has many orders

### Tables

```sql
-- Users: Dynamic login identity
users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dynamic_id      TEXT UNIQUE NOT NULL,
  wallet_address  TEXT NOT NULL,
  preset          TEXT NOT NULL,            -- 'institutional' | 'degen'
  created_at      TIMESTAMP DEFAULT NOW()
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

-- Delegations: Dynamic SDK delegated signing authority (1:1 with proposal)
delegations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID UNIQUE NOT NULL REFERENCES proposals(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  delegation_data TEXT,                     -- JSON: Dynamic SDK delegation payload (TBD)
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW(),
  revoked_at      TIMESTAMP
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
Proposal: confirmed → completed (all orders done) / failed
Delegation: active → revoked (when proposal completes/fails)
Order: pending → executing → completed / failed
```

When all orders under a proposal reach a terminal state (completed/failed), the proposal status updates accordingly and the linked delegation is revoked.

## Tasks

- [ ] Create TypeORM entities for all 4 tables in `apps/server/src/db/`
- [ ] Create shared types in `packages/shared/types.ts` (enums for status, type, action)
- [ ] Set up SQLite TypeORM connection config
- [ ] Add migration for initial schema
- [ ] Remove old `messages` table from architecture spec (replaced by proposals)
