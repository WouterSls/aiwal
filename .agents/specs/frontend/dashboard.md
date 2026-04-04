# Dashboard Spec

> Route: `/dashboard` — main trading interface, authenticated users only

---

## Layout

```
┌─────────────────────────────────────────────────┐
│                    Header                        │
├────────────────────┬────────────────────────────┤
│                    │                            │
│   Left Panel       │       Chat Panel           │
│   (50%)            │       (50%)                │
│                    │                            │
│   Default:         │   Message list             │
│   Portfolio View   │   + input bar              │
│                    │                            │
│   On proposal:     │                            │
│   Proposal Editor  │                            │
│                    │                            │
├────────────────────┴────────────────────────────┤
│              Proposals History                   │
│              (below fold)                        │
└─────────────────────────────────────────────────┘
```

Above fold is a fixed 50/50 split. Below fold is the proposals history table, only reachable by scrolling.

---

## Header

Always rendered in authenticated state on `/dashboard`. Shows:
- App logo (left)
- Wallet address truncated (right)
- Preset badge (right)
- Disconnect button (right)

No nav links. No unauthenticated state needed here — redirect to `/` if session is missing.

---

## Left Panel — Portfolio View (default)

Displayed by default when no active proposal exists.

**Component:** `PortfolioView`

Shows all tokens held by the connected wallet. Data comes from:
- `GET /api/portfolio` — token balances for the wallet
- `GET /api/prices` — USD prices via Chainlink CRE HTTP

Each row (`TokenRow`) shows:
- Token icon
- Token symbol
- Balance
- USD value

React Query polls both endpoints every 30s. No filtering — all wallet tokens are shown. On fetch error, show empty state (no tokens displayed).

---

## Left Panel — Proposal Editor (active proposal)

Replaces `PortfolioView` when Claude has produced a trade proposal. The user can refine the proposal by editing fields directly or by continuing to chat.

**Component:** `ProposalEditor`

### Fields (all editable inline)

| Field | Type |
|-------|------|
| `type` | select (swap / limit / etc.) |
| `action` | text |
| `token_in` | text |
| `token_out` | text |
| `amount_in` | number input |
| `expected_out` | number input |
| `slippage` | number input |
| `condition` | text |

### Behaviour

- Field edits update `activeProposal` local state immediately.
- Chat refinements (user sends a follow-up message) cause Claude to return an updated proposal JSON → form fields update to reflect the new values.
- **Confirm** button → opens `ConfirmationModal`.
- **Cancel** button → clears `activeProposal`, left panel returns to `PortfolioView`.

See [claude-interaction.md](../llm-context-integration/claude-interaction.md) for proposal JSON format and parsing logic.

---

## Right Panel — Chat

**Components:** `ChatPanel`, `MessageBubble`, `ChatInput`

- Message list scrolls, auto-scrolls to bottom on new messages.
- Claude is called via `/api/chat` Next.js route (streaming, no direct browser-to-Anthropic call).
- Agent messages stream in token-by-token via the Claude API.
- On stream completion: response is parsed for a proposal JSON block. If found, `activeProposal` is set and left panel switches to `ProposalEditor`.
- If a proposal is already active and the user sends a follow-up, Claude receives the current proposal state as context and may return an updated proposal.

---

## Confirmation Modal

**Component:** `ConfirmationModal` (shadcn Dialog)

Triggered by the Confirm button in `ProposalEditor`.

Shows:
- Trade summary: token_in → token_out, amount_in, expected_out, slippage
- Proposal type

Actions:
- **Confirm** → `POST /api/orders` → modal closes, `activeProposal` cleared, left panel returns to portfolio, new order appears in proposals history
- **Cancel** → modal closes, proposal editor remains open

---

## Proposals History

Below the fold. Data from `GET /api/orders`, refetched after each order confirmation.

**Components:** `ProposalsHistory`, `ProposalRow`

Each row shows:
- Type
- Token pair
- Amount
- Status badge: `confirmed` (yellow) / `completed` (green) / `failed` (red)
- Timestamp
- Tx hash link (when available)

---

## State

| State | Where | Description |
|-------|-------|-------------|
| `activeProposal` | local (useState) | Current proposal being edited, or `null` |
| `chatMessages` | local (useState) | Full message history for the session — intentionally reset on page refresh |
| `['portfolio']` | React Query | Wallet token balances, 30s refetch |
| `['prices']` | React Query | USD prices, 30s refetch + before each Claude call |
| `['orders']` | React Query | Proposals history, refetch on mutation |

---

## Components

```
components/
├── portfolio-view.tsx
├── token-row.tsx
├── proposal-editor.tsx
├── chat-panel.tsx
├── message-bubble.tsx
├── chat-input.tsx
├── confirmation-modal.tsx
├── proposals-history.tsx
└── proposal-row.tsx
```

---

## Auth

- Page is client-side protected: if no Dynamic session, render nothing (no flash, no redirect).
- Header is always in authenticated state — no login UI rendered here.
