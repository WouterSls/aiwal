# Claude LLM Interaction — Spec

> JTBD: LLM Context Integration · Status: DONE

---

## Overview

Defines how the frontend communicates with the Claude API to power the Aiwal trading agent. Claude is called via a **Next.js API route proxy** (`/api/chat`) — never directly from the browser. The backend only receives confirmed proposals for execution.

## Flow

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                            │
│                                                          │
│  1. User types message                                   │
│  2. Frontend assembles system prompt from React Query    │
│     cache (portfolio, prices, orders) + preset fragment  │
│  3. Frontend POSTs to /api/chat (Next.js proxy)          │
│  4. /api/chat streams response from Anthropic SDK        │
│  5. Frontend renders streaming text in chat              │
│  6. After stream completes → parse for proposal JSON     │
│  7. If proposal → show ProposalEditor (left panel)       │
│  8a. User edits + confirms → ConfirmationModal           │
│      → POST /api/orders → clear chat after 2.5s delay    │
│  8b. User rejects → append rejection to chat history     │
│      → clear activeProposal                              │
│                                                          │
└──────────────────────────┬──────────────────────────────┘
                           │ confirmed proposal
                           ▼
┌──────────────────────────────────────────────────────────┐
│                    Backend                                │
│  Receives confirmed proposal → executes on-chain         │
│  Orders polled via GET /api/orders every 5s              │
└──────────────────────────────────────────────────────────┘
```

---

## 1. Context Assembly (Frontend)

Before each Claude call, the frontend assembles a context bundle from locally available data and backend API calls.

### Data Sources

| Data            | Source                                          | When fetched                        |
| --------------- | ----------------------------------------------- | ----------------------------------- |
| Trading preset  | `GET /api/users?walletAddress=…` on mount       | Once, stored in dashboard state     |
| Preset fragment | `src/lib/presets.ts` — matched from preset type | Derived from preset state           |
| Wallet balances | React Query cache `["portfolio", address]`      | On mount + every 30s                |
| Open orders     | React Query cache `["orders"]`                  | On mount + every 5s                 |
| Price feeds     | React Query cache `["prices"]`                  | On mount + every 30s                |
| Chat history    | Local state (message array)                     | Already in memory, capped at 25 msg |

### Context Refresh Strategy

- System prompt assembled fresh before each `sendMessage` call from React Query cache snapshots
- Portfolio and prices: `refetchInterval: 30_000`
- Orders: `refetchInterval: 5000` (fast poll to reflect execution status)
- After a confirmed order: `queryClient.invalidateQueries({ queryKey: ["orders"] })` forces immediate refresh
- Chat history: capped at last 25 messages with simple FIFO trim

---

## 2. System Prompt

The system prompt is assembled once on chat mount (and refreshed when context data changes). It is sent as the `system` parameter in the Claude API call.

### Template

````
You are the Aiwal trading agent on Base L2.

## Your Profile
{preset_system_prompt_fragment}

## Wallet State
Address: {wallet_address}
Balances:
{formatted_balances}

## Open Orders
{formatted_orders}

## Current Market Data
{formatted_price_feeds}

## Response Rules

You MUST respond in one of these three formats:

### Format 1: Trading Strategy Proposal
When the user wants to execute a trade, set up a strategy, or send tokens, wrap your proposal in a ```json code block with this exact structure:

```json
{
  "title": "<short strategy name, e.g. 'Exit ETH at 3 levels'>",
  "reasoning": "<1-2 sentence explanation of the overall strategy>",
  "token_in": "<symbol of token being sold/sent>",
  "token_out": "<symbol of token being received>",
  "trades": [
    {
      "type": "swap" | "limit_order" | "send",
      "amount_in": "<amount as string>",
      "expected_out": "<amount as string>",
      "slippage_tolerance": "<percentage as string>",
      "tradingPriceUsd": <price in USD as number, or null for market swaps>
    }
  ]
}
````

For a simple swap, `trades` contains exactly one entry with `type: "swap"` and `tradingPriceUsd: null`.
For an exit strategy, `trades` contains multiple limit orders at different price targets.
For a send, `type` is `"send"` and `token_out` on the strategy is `null`.
You may include conversational text before or after the JSON block.

### Format 2: Informational Response

When the user asks about market conditions, portfolio, strategy, or anything that doesn't require a trade. Respond naturally in your persona.

### Format 3: Clarifying Question

When the user's intent is ambiguous or missing critical details (which token, how much, etc.), ask a specific follow-up question.

## Constraints

- NEVER propose a trade for more than the user's available balance
- ALWAYS respect the slippage tolerance from your profile
- ALWAYS include reasoning for any proposal
- If the user asks to trade a token not in your allowed list, explain why you can't
- All amounts must be strings to preserve decimal precision

````

---

## 3. Message Format (Claude API Call)

### API Call Structure

```typescript
const response = await anthropic.messages.create({
  model: "claude-haiku-4-5-20251001", // haiku for dev/testing; switch to claude-sonnet-4-6 for production
  max_tokens: 1024,
  system: assembledSystemPrompt,
  messages: conversationHistory,
  stream: true,
});
````

### Conversation History Shape

```typescript
type Message = {
  role: "user" | "assistant";
  content: string;
};

// Messages array maintains full conversation
// Confirmed proposals are NOT stripped — they remain in history
// so Claude has context of what was already proposed/confirmed
```

### Context Window Management

- Keep last 25 messages in conversation history
- When approaching limit, trim oldest messages (keep system prompt intact)
- System prompt is re-assembled with fresh data, not stored in message history

---

## 4. Response Parsing (Frontend)

The frontend must parse Claude's response to detect transaction proposals.

### Parsing Logic

````typescript
function parseAgentResponse(content: string): {
  text: string;
  strategy: TradingStrategy | null;
} {
  // 1. Extract JSON block from markdown code fence
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

  if (!jsonMatch) {
    return { text: content, strategy: null };
  }

  // 2. Parse and validate the JSON
  const parsed = JSON.parse(jsonMatch[1]);

  // 3. Validate required fields
  const valid =
    parsed.title &&
    parsed.token_in &&
    parsed.token_out &&
    Array.isArray(parsed.trades) &&
    parsed.trades.length > 0 &&
    parsed.trades.every((t: Trade) => t.type && t.amount_in);

  if (!valid) {
    return { text: content, strategy: null };
  }

  // 4. Return both the conversational text and the structured strategy
  const text = content.replace(/```json[\s\S]*?```/, "").trim();
  return { text, strategy: parsed };
}
````

### TradingStrategy Type

```typescript
interface Trade {
  type: "send" | "swap" | "limit_order";
  amount_in: string;
  expected_out: string;
  slippage_tolerance: string;
  tradingPriceUsd: number | null;
}

interface TradingStrategy {
  title: string;
  reasoning: string;
  token_in: string;
  token_out: string;
  trades: Trade[];
}
```

---

## 5. Confirmation Flow

When a strategy is detected:

```
1. Render Claude's text response in chat (strategy JSON stripped from display)
2. Left panel switches from PortfolioView → ProposalEditor
   - Strategy title + reasoning shown at top
   - Each trade rendered as a shadcn Collapsible row
     - Header: "{action} {amount_in} {token_in} → {token_out} @ {condition}"
     - Open form: all trade fields editable inline
   - Single swap defaults to open; multi-trade strategies default to closed
   - User can add/remove trades
   - [Confirm] [Cancel] buttons at bottom
3. On Confirm → opens ConfirmationModal showing strategy title + trade count
   → POST /api/orders with full TradingStrategy payload
   → Show "Strategy submitted. Starting fresh — what's next?" in chat
   → After 2.5s delay: clear all chat messages
   → Invalidate orders query (ProposalsHistory picks up new orders)
4. On Cancel/Reject → append "I rejected this proposal." to chat history
   → Clear activeStrategy → left panel returns to PortfolioView
5. Order status tracked via 5s polling of GET /api/orders (all orders for address)
   → No per-order polling in MVP
```

---

## 6. Streaming

Claude responses are streamed to the frontend for real-time display.

```typescript
// Stream handling
for await (const event of response) {
  if (
    event.type === "content_block_delta" &&
    event.delta.type === "text_delta"
  ) {
    // Append delta text to current message
    appendToCurrentMessage(event.delta.text);
  }
}

// After stream completes, parse full message for proposals
const { text, proposal } = parseAgentResponse(fullMessage);
```

Proposal detection and the confirmation modal only trigger **after** the full stream completes — no partial JSON parsing.

---

## 7. Error Handling

| Scenario                    | Handling                                                 |
| --------------------------- | -------------------------------------------------------- |
| Claude API rate limit       | Show "Agent is busy, try again in a moment" in chat      |
| Claude API error (5xx)      | Show "Agent unavailable" + retry button                  |
| Invalid JSON in response    | Treat as informational response (no proposal card)       |
| Proposal exceeds balance    | Frontend validates before showing confirm — show warning |
| Network error during stream | Show partial response + "Connection lost" + retry button |

---

## 8. API Key Handling

The Claude API key is used in the Next.js API route (`/api/chat`), never exposed to the browser:

- API key stored as `ANTHROPIC_API_KEY` (server-only env var, no `NEXT_PUBLIC_` prefix)
- The `/api/chat` route is the sole entry point — it owns the Anthropic client instance
- This also resolves the CORS blocker from direct browser-to-Anthropic calls

---

## 9. Preset Integration

The preset is fetched once on dashboard mount via `GET /api/users?walletAddress=…` and stored in component state. The `buildSystemPrompt` function in `src/lib/presets.ts` selects the correct fragment:

| Preset        | Fragment                                    |
| ------------- | ------------------------------------------- |
| `degen`       | CT degen persona, 5% slippage, any token    |
| `institutional` | Risk analyst persona, 0.3% slippage, whitelist |

Both fragments define: persona, tone, constraints, slippage, and token scope. Preset is locked after onboarding — no switching in MVP.

---

## Tasks

- [x] Create `/api/chat` Next.js route as Anthropic SDK streaming proxy
- [x] Create `src/lib/presets.ts` — preset fragments + `buildSystemPrompt`
- [x] Assemble system prompt from React Query cache before each `sendMessage`
- [x] Fetch user preset on dashboard mount, store in state
- [x] Stream Claude response to chat, parse full message after stream completes
- [x] Confirm flow: POST /api/orders → show done message → clear chat after 2.5s
- [x] Reject flow: append rejection message → clear activeStrategy
- [x] Poll all orders every 5s via ProposalsHistory `refetchInterval`
- [x] Handle error states (agent unavailable message in chat)
- [x] Update `src/lib/claude.ts` — replace `TransactionProposal` with `Trade` + `TradingStrategy`, update `parseAgentResponse`
- [x] Update system prompt Format 1 in `src/lib/presets.ts` to strategy JSON shape
- [x] Wire strategy detection to ProposalEditor (left panel swap)
- [ ] Add `ANTHROPIC_API_KEY` to production env config

---

## ⚠️ Review Notes

> These notes were flagged during spec review and should be addressed before or during implementation.

### 🔴 Blockers

- **CORS will block browser-to-Anthropic calls.** The Anthropic API does not set `Access-Control-Allow-Origin` for browser origins. Calling Claude directly from the frontend will fail. The Claude call **must** go through a server-side proxy (e.g., a Next.js API route at `/api/chat`). This also solves the API key exposure problem below.

### 🟡 High Priority

- **API key exposure.** `NEXT_PUBLIC_` env vars are bundled into the client-side JS and visible to anyone inspecting the page. Even for a hackathon demo, routing through a Next.js API route is minimal effort and eliminates this risk entirely.
- **`max_tokens: 1024` may be too low.** A proposal JSON block alone can consume ~300 tokens. Combined with conversational text and reasoning, responses may get truncated. Consider raising to 2048.
- **No schema validation on proposals.** `JSON.parse` + checking 5 field names exist doesn't catch invalid enum values (e.g., `type: "yolo"`). A lightweight Zod schema for `TransactionProposal` would prevent malformed proposals from reaching the confirmation modal.

### 🟠 Medium Priority

- **Stale balance race condition.** Portfolio and orders are refreshed every 30 seconds, but Claude could propose a trade based on a stale balance immediately after a confirmed swap. Consider forcing a re-fetch after every confirmed transaction before the next Claude call.
- **Balance can change between proposal display and user confirm.** The frontend validates balances before showing the confirm button, but the balance may shift before the user clicks Confirm. The backend should re-validate balances on `POST /api/orders`.
- **Message trimming strategy is underspecified.** Simple FIFO trimming of the 50-message cap could drop important early context (e.g., risk preferences stated in message 2). Consider keeping the first 2–3 messages plus the most recent N.
- **No abort mechanism for in-flight streams.** If the user navigates away or sends a new message while Claude is still streaming, the spec doesn't define cleanup behavior. Use an `AbortController` to cancel the fetch on unmount or new message.

### 🔵 Low Priority / Acceptable for MVP

- **Regex-based JSON extraction is fragile.** If Claude nests a code block or produces malformed JSON, parsing silently falls back to informational. Acceptable for hackathon, but worth hardening later.
- **No retry logic beyond a UI button.** Transient Claude API failures (5xx, network errors) only show a retry button with no automatic backoff. Fine for MVP.
- **Preset prompt fragments are external dependencies.** The `{preset_system_prompt_fragment}` references `agent-presets/*.md` files — ensure these exist and are loaded correctly before the context assembler runs.
