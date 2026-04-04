# ProposalEditor Component Spec

> JTBD: Frontend · Status: NOT DONE

---

## Overview

The `ProposalEditor` replaces the current single-trade form with a **strategy editor** — a proposal is a named strategy containing one or more trades. The left panel swaps from `PortfolioView` to `ProposalEditor` when the agent returns a strategy.

---

## Strategy Model

A strategy has:
- A `title` (e.g. "Exit ETH at 3 levels")
- A `reasoning` string
- An array of `Trade` objects

```ts
interface Trade {
  type: "send" | "swap" | "limit_order";
  amount_in: string;
  expected_out: string;
  slippage_tolerance: string;
  tradingPriceUsd: number | null;  // null for market swaps
  to: string | null;               // recipient address for send trades
}

interface TradingStrategy {
  title: string;
  reasoning: string;
  token_in: string;        // shared across all trades
  token_out: string;
  trades: Trade[];
}
```

---

## Component Layout

```
┌─────────────────────────────────────┐
│ PROPOSAL                            │
│ Exit ETH at 3 levels                │  ← strategy title
│ reasoning text here                 │  ← collapsed by default if long
├─────────────────────────────────────┤
│ ▼  SELL 33% ETH → USDC  @ $3,200   │  ← Trade row (collapsed)
│ ▼  SELL 33% ETH → USDC  @ $3,600   │
│ ▼  SELL 34% ETH → USDC  @ $4,000   │
│ + Add trade                         │
├─────────────────────────────────────┤
│ [Confirm]              [Cancel]     │
└─────────────────────────────────────┘
```

---

## Trade Row: Collapsible

Each trade uses a `<details>` element.

**Collapsed header** (always visible):
- `swap` / `limit_order`: `{amount_in} {token_in} → {token_out} @ $X` or `@ market` when `tradingPriceUsd` is null
- `send`: `{amount_in} {token_in} → {to}`
- Small chevron to toggle

**Open form — fields shown per type:**

| Field              | swap       | limit_order | send       |
| ------------------ | ---------- | ----------- | ---------- |
| Type selector      | editable   | editable    | editable   |
| Amount In          | editable   | editable    | editable   |
| Expected Out       | read-only  | editable    | hidden     |
| Slippage (%)       | editable   | editable    | hidden     |
| Price (USD)        | hidden if null, read-only if set | editable | hidden |
| To (address)       | hidden     | hidden      | editable   |

Fields not applicable to a trade type are not rendered at all.

**Default state:**
- Single-trade strategy: trade defaults to **open**
- Multi-trade strategy: all trades default to **closed**

---

## Adding / Removing Trades

- `+ Add trade` duplicates the last trade in the list (full copy), appended open
- Each open trade form has a `Remove` button (disabled if only 1 trade remains)

---

## Confirmation

One `Confirm` button at the bottom confirms the full strategy atomically. Opens `ConfirmationModal` which shows strategy title + trade count before final submit.

`POST /api/orders` receives the full `TradingStrategy` payload.

---

## File

```
frontend/src/components/proposal-editor.tsx   ← replace existing
```

Types live in `src/lib/claude.ts`.

---

## Tasks

- [ ] Update `parseAgentResponse` to parse strategy JSON (title + trades array)
- [ ] Rewrite `proposal-editor.tsx` — field visibility per trade type, read-only expected_out for swaps, duplicate-last on add trade
- [ ] Update `dashboard/page.tsx` — replace any `TransactionProposal` refs with `TradingStrategy`
- [ ] Update `confirmation-modal.tsx` — show strategy title + trade count summary
- [ ] Update `POST /api/orders` route to accept `TradingStrategy` payload
