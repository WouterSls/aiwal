# Transaction Confirmations Spec

> Aiwal Frontend · Next.js API Route · MVP · April 2026

## Purpose

Receive transaction confirmation callbacks from the backend, buffer them in memory, and display each confirmed or failed transaction exactly once as a toast with a link to BaseScan.

---

## API Routes

### `POST /api/confirmations`

Backend calls this when an order completes or fails.

**Request body:** full `OrderResponseDto` from the backend, plus `walletAddress`

```typescript
interface ConfirmationPayload {
  id: string;
  proposalId: string;
  type: 'send' | 'swap' | 'limit_order';
  amountIn: string;
  expectedOut?: string;
  slippageTolerance?: string;
  confirmationHash?: string;
  status: 'completed' | 'failed';
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
}
```

**Behavior:**
- Appends the payload to an in-memory queue (module-level array in `lib/confirmations-store.ts`)
- Returns `{ ok: true }` with status 200

### `GET /api/confirmations?walletAddress=`

Frontend polls this to consume pending confirmations for the current wallet.

**Query params:** `walletAddress` — the user's Dynamic SDK wallet address

**Behavior:**
- Filters queue entries matching `walletAddress`
- Removes matched entries from the queue (consume-once)
- Returns the matched entries as an array

**Response:**

```typescript
ConfirmationPayload[]
```

---

## In-Memory Store

```typescript
// lib/confirmations-store.ts

const queue: ConfirmationPayload[] = [];

export function enqueue(payload: ConfirmationPayload): void {
  queue.push(payload);
}

export function consume(walletAddress: string): ConfirmationPayload[] {
  const matches = queue.filter(c => c.walletAddress === walletAddress);
  matches.forEach(c => queue.splice(queue.indexOf(c), 1));
  return matches;
}
```

---

## Frontend Hook

```typescript
// lib/use-confirmations.ts

export function useConfirmations(walletAddress: string | undefined): void
```

- Polls `GET /api/confirmations?walletAddress=` every 3 seconds using `setInterval`
- Only active when `walletAddress` is defined
- For each result, fires one shadcn `toast`:
  - **completed**: `"Transaction confirmed"` with a "View on BaseScan" link → `https://basescan.org/tx/{confirmationHash}`
  - **failed**: `"Transaction failed"` with no link
- Each confirmation is consumed server-side on retrieval, so it is shown exactly once

---

## Integration

Mount `useConfirmations` in the dashboard page, passing the wallet address from the Dynamic SDK:

```typescript
// app/(app)/dashboard/page.tsx

const { primaryWallet } = useDynamicContext();
useConfirmations(primaryWallet?.address);
```

---

## File Structure

```
frontend/src/
├── app/
│   └── api/
│       └── confirmations/
│           └── route.ts       # POST + GET handlers
└── lib/
    ├── confirmations-store.ts # in-memory queue
    └── use-confirmations.ts   # polling hook + toast
```

---

## Notes

- The in-memory queue is process-local. Serverless cold starts will reset it — acceptable for POC.
- BaseScan URL: `https://basescan.org/tx/{confirmationHash}`
