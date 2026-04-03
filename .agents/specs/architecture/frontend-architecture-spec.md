# Frontend Architecture Spec

> Aiwal MVP — Next.js (App Router) on Vercel

---

## Overview

Single-page-feel Next.js app with three routes: landing, onboarding, and the main trading interface. Uses Dynamic SDK for auth, React Query for server state, WebSocket for streaming Claude responses, and shadcn/ui + Tailwind for styling. Light mode only, desktop only.

## Purpose

Define the frontend page structure, component hierarchy, state management, real-time communication, and integration points with the Express backend.

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js (App Router) |
| Hosting | Vercel |
| Styling | Tailwind CSS |
| Components | shadcn/ui (Radix primitives) |
| Auth | Dynamic SDK (client-side) |
| Server state | React Query (`@tanstack/react-query`) |
| AI | Claude API (direct from frontend, streaming) |
| Theme | Light mode only |
| Responsiveness | Desktop only (no mobile) |

---

## Pages

### `/` — Landing

Login page. Dynamic SDK handles social/email login and embedded wallet creation.

**Components:**
- `LandingPage` — logo, tagline, login button
- `DynamicWidget` — Dynamic SDK login widget

**Flow:**
1. User clicks login → Dynamic SDK modal
2. On auth success → redirect to `/onboard` (first time) or `/chat` (returning user)

### `/onboard` — Preset Selection

One-time page where the user picks their trading profile.

**Components:**
- `OnboardPage` — layout wrapper
- `PresetCard` — clickable card for each preset (Institutional / Degen)
  - Shows: name, risk level, description, allowed tokens summary

**Flow:**
1. User selects preset → `POST /api/auth/session` stores preset in DB
2. Redirect to `/chat`

### `/chat` — Main Trading Interface

Core page. Split layout with contextual left panel and chat on the right.

#### Layout

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

**Above fold — 50/50 split:**

- **Left panel** switches between two views:
  - **Portfolio view** (default) — token balances with USD prices from Chainlink CRE via `GET /api/prices` and `GET /api/portfolio`
  - **Proposal editor** (when agent creates a proposal) — editable form showing proposal fields, user can modify before confirming

- **Right panel** — chat interface with streaming responses

**Below fold:**
- **Proposals history** — list of all user proposals from `GET /api/orders` with status indicators

---

## Components

### Header
- `Header` — app logo, wallet address (truncated), preset badge, disconnect button

### Left Panel — Portfolio View
- `PortfolioView` — container for token list
- `TokenRow` — single token: icon, symbol, balance, USD value
- Data: `GET /api/portfolio` (balances) + `GET /api/prices` (USD prices via CRE HTTP)
- Polling: React Query with 30s refetch interval for prices

### Left Panel — Proposal Editor
- `ProposalEditor` — editable form that appears when Claude proposes a transaction
- Fields: type, action, token_in, token_out, amount_in, expected_out, slippage, condition
- User can edit fields directly in the form
- User can also refine via chat (agent sends updated proposal → form updates)
- **Confirm button** → opens `ConfirmationModal`
- **Cancel button** → discards proposal, returns to portfolio view

### Right Panel — Chat
- `ChatPanel` — message list + input
- `MessageBubble` — single message (user or agent)
  - Agent messages stream in via Claude API (frontend-direct)
  - On stream complete: parsed for proposal JSON → if present, left panel switches to `ProposalEditor`
- `ChatInput` — text input + send button
- Scroll: auto-scroll to bottom on new messages, scroll lock when user scrolls up

### Confirmation Modal
- `ConfirmationModal` — shadcn Dialog overlay
- Shows: trade summary (tokens, amounts, slippage, gas estimate), proposal type
- Actions: Confirm (→ `POST /api/orders/:id/confirm`) or Cancel
- On confirm: modal closes, left panel returns to portfolio, order appears in proposals history

### Proposals History
- `ProposalsHistory` — table/list below the fold
- `ProposalRow` — type, tokens, amount, status badge, timestamp, tx hash link
- Status badges: `confirmed` (yellow), `completed` (green), `failed` (red)
- Data: `GET /api/orders`

---

## State Management

### React Query Keys

| Key | Endpoint | Refetch |
|-----|----------|---------|
| `['portfolio']` | `GET /api/portfolio` | 30s interval |
| `['prices']` | `GET /api/prices` | 30s interval + before each Claude call |
| `['orders']` | `GET /api/orders` | On mutation |
| `['user']` | `GET /api/auth/session` | On mount |

### Local State

- `activeProposal` — the current proposal being edited (or `null` when showing portfolio)
- `chatMessages` — array of messages (local + streamed from Claude API)

---

## Integration Points

- **Claude API** — called directly from the frontend (streaming). Context assembly, prompt construction, and response parsing defined in [claude-interaction spec](../llm-context-integration/claude-interaction.md).
- **Backend REST API** — React Query for portfolio, prices, orders, auth. Base URL from `NEXT_PUBLIC_API_URL` env var. Auth via Dynamic SDK session token as `Authorization: Bearer <token>`.
- **Dynamic SDK** — client-side auth provider, embedded wallet creation.

---

## File Structure

```
apps/web/
├── app/
│   ├── layout.tsx              # Root layout, providers (QueryClient, Dynamic)
│   ├── page.tsx                # Landing / login
│   ├── onboard/
│   │   └── page.tsx            # Preset selection
│   └── chat/
│       └── page.tsx            # Main trading interface
├── components/
│   ├── ui/                     # shadcn/ui components (button, dialog, input, etc.)
│   ├── header.tsx
│   ├── portfolio-view.tsx
│   ├── token-row.tsx
│   ├── proposal-editor.tsx
│   ├── chat-panel.tsx
│   ├── message-bubble.tsx
│   ├── chat-input.tsx
│   ├── confirmation-modal.tsx
│   ├── proposals-history.tsx
│   ├── proposal-row.tsx
│   └── preset-card.tsx
├── lib/
│   ├── api.ts                  # React Query hooks (usePortfolio, usePrices, etc.)
│   ├── claude.ts               # Claude API client + streaming (see claude-interaction spec)
│   └── dynamic.ts              # Dynamic SDK config
├── package.json
└── tailwind.config.ts
```

---

## Tasks

- [ ] Scaffold Next.js app in `apps/web/` with App Router
- [ ] Install and configure Tailwind CSS + shadcn/ui
- [ ] Set up Dynamic SDK provider in root layout
- [ ] Set up React Query provider in root layout
- [ ] Build landing page with Dynamic login widget
- [ ] Build onboard page with preset cards
- [ ] Build chat page layout (50/50 split + below fold)
- [ ] Build `PortfolioView` + `TokenRow` with React Query polling
- [ ] Build `ChatPanel` + `MessageBubble` + `ChatInput`
- [ ] Build `ProposalEditor` with editable fields
- [ ] Build `ConfirmationModal` with confirm/cancel actions
- [ ] Build `ProposalsHistory` + `ProposalRow` table
- [ ] Connect all API endpoints via React Query hooks in `lib/api.ts`
