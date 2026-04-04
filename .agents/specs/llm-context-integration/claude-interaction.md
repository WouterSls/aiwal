# Claude LLM Interaction — Spec

> JTBD: LLM Context Integration · Status: NOT DONE

---

## Overview

Defines how the frontend communicates with the Claude API to power the Aiwal trading agent. Claude is called **directly from the frontend** — no backend proxy for chat. The backend only receives confirmed proposals for execution.

## Flow

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│                                                      │
│  1. User types message                               │
│  2. Frontend assembles context bundle                │
│  3. Frontend calls Claude API (streaming)            │
│  4. Claude responds (text + optional proposal JSON)  │
│  5. Frontend renders response in chat                │
│  6. If proposal → show confirmation modal            │
│  7. User confirms → POST /api/orders to backend      │
│                                                      │
└──────────────────────────┬──────────────────────────┘
                           │ confirmed proposal
                           ▼
┌──────────────────────────────────────────────────────┐
│                    Backend                            │
│  Receives confirmed proposal → executes on-chain     │
└──────────────────────────────────────────────────────┘
```

---

## 1. Context Assembly (Frontend)

Before each Claude call, the frontend assembles a context bundle from locally available data and backend API calls.

### Data Sources

| Data            | Source                         | When fetched            |
| --------------- | ------------------------------ | ----------------------- |
| Trading profile | Local state (preset selection) | Already in memory       |
| Wallet balances | `GET /api/portfolio`           | On chat mount + refresh |
| Open orders     | `GET /api/orders`              | On chat mount + refresh |
| Price feeds     | `GET /api/prices`              | Before each message     |
| Chat history    | Local state (message array)    | Already in memory       |

### Context Refresh Strategy

- Portfolio and orders: fetched on chat page mount, re-fetched every 30 seconds or after a confirmed transaction
- Price feeds: fetched fresh before each message sent to Claude
- Chat history: maintained in frontend state, passed as conversation messages

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

### Format 1: Transaction Proposal
When the user wants to execute a trade, wrap your proposal in a ```json code block with this exact structure:

```json
{
  "type": "swap" | "limit_order" | "stop_loss" | "take_profit",
  "action": "buy" | "sell",
  "token_in": "<symbol>",
  "token_out": "<symbol>",
  "amount_in": "<amount as string>",
  "expected_out": "<amount as string>",
  "slippage_tolerance": "<percentage as string>",
  "condition": "<price condition if limit/SL/TP, null for swap>",
  "reasoning": "<1-2 sentence explanation>"
}
````

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
  model: "claude-sonnet-4-6-20250514",
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
  proposal: TransactionProposal | null;
} {
  // 1. Extract JSON block from markdown code fence
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

  if (!jsonMatch) {
    return { text: content, proposal: null };
  }

  // 2. Parse and validate the JSON
  const parsed = JSON.parse(jsonMatch[1]);

  // 3. Validate required fields
  const required = ["type", "action", "token_in", "token_out", "amount_in"];
  const valid = required.every((field) => parsed[field]);

  if (!valid) {
    return { text: content, proposal: null };
  }

  // 4. Return both the conversational text and the structured proposal
  const text = content.replace(/```json[\s\S]*?```/, "").trim();
  return { text, proposal: parsed };
}
````

### TransactionProposal Type

```typescript
interface TransactionProposal {
  type: "swap" | "limit_order" | "stop_loss" | "take_profit";
  action: "buy" | "sell";
  token_in: string;
  token_out: string;
  amount_in: string;
  expected_out: string;
  slippage_tolerance: string;
  condition: string | null;
  reasoning: string;
}
```

---

## 5. Confirmation Flow

When a proposal is detected:

```
1. Render Claude's text response in chat
2. Render proposal as a styled card below the message:
   - Action summary: "Swap 2 ETH → USDC"
   - Expected output + slippage
   - Reasoning from Claude
   - [Confirm] [Reject] buttons
3. On Confirm → POST /api/orders with proposal payload
4. On Reject → append "User rejected this proposal" to chat history
5. Backend responds with order ID + status
6. Frontend shows execution status in chat
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

The Claude API key is used from the frontend. For MVP/hackathon:

- API key stored as `NEXT_PUBLIC_ANTHROPIC_API_KEY` env var
- Loaded via Next.js public env (acceptable for hackathon demo)
- **Post-hackathon:** move to backend proxy or edge function to protect key

---

## 9. Preset Integration

The `{preset_system_prompt_fragment}` in the system prompt is swapped based on the user's selected preset:

| Preset        | Fragment source                                        |
| ------------- | ------------------------------------------------------ |
| Institutional | `agent-presets/institutional-preset.md` → prompt block |
| Degen         | `agent-presets/degen-preset.md` → prompt block         |

Both fragments define: persona, tone, constraints, slippage, and token scope.

---

## Tasks

- [ ] Create `anthropic` client wrapper in `apps/web/lib/claude.ts`
- [ ] Build context assembler that fetches portfolio, orders, prices and constructs system prompt
- [ ] Implement streaming chat hook (`useChat` or custom) that calls Claude and handles deltas
- [ ] Build response parser to extract JSON proposals from Claude responses
- [ ] Wire proposal detection to confirmation modal component
- [ ] Add conversation history management with 50-message cap
- [ ] Integrate preset system prompt fragments into context assembler
- [ ] Handle error states (rate limit, API errors, invalid JSON)
- [ ] Add `NEXT_PUBLIC_ANTHROPIC_API_KEY` to Vercel env config

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
