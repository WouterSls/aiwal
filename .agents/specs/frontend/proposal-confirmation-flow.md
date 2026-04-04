# Proposal Confirmation Flow Spec

> Aiwal Frontend · Dynamic SDK Delegated Access · MVP · April 2026

## Purpose

When the user confirms a proposal, fire delegation and order submission in parallel. The backend confirms when it has both the delegation materials and the order. Frontend polls for that confirmation with a waiting state and timeout.

---

## Flow

```
User clicks Confirm
       │
       ├──────────────────────────────────────────┐
       │                                          │
       ▼                                          ▼
initDelegationProcess()              POST /api/orders { strategy }
(if not already delegated)                        │
       │                                          ▼
       │                               Backend creates order
       │                               status: 'pending'
       │                               returns { orderId }
       │                                          │
       ▼                                          ▼
Dynamic MPC ceremony              Frontend shows waiting state
       │                          Frontend polls GET /api/orders/:id
       ▼
Dynamic webhook → backend
       │
       ├── store delegation materials
       ├── find pending orders for userId
       └── mark order status: 'confirmed'
                    │
                    ▼
          Poll picks up 'confirmed'
                    │
                    ▼
          Frontend: thank-you state, clear proposal

Timeout (30s): show error, keep proposal intact
```

---

## `useProposalConfirmation` Hook

```ts
// hooks/use-proposal-confirmation.ts
import { useState } from 'react'
import { useWalletDelegation } from '@dynamic-labs/sdk-react-core'
import { ChainEnum } from '@dynamic-labs/sdk-api-core'

type ConfirmState = 'idle' | 'waiting' | 'confirmed' | 'error'

const POLL_INTERVAL_MS = 1500
const TIMEOUT_MS = 30_000

export function useProposalConfirmation() {
  const [state, setState] = useState<ConfirmState>('idle')
  const [error, setError] = useState<string | null>(null)
  const { getWalletsDelegatedStatus, initDelegationProcess } = useWalletDelegation()

  const isDelegated = (): boolean =>
    getWalletsDelegatedStatus().some(
      s => s.chain === ChainEnum.Evm && s.status === 'delegated'
    )

  const confirm = async (strategy: TradingStrategy): Promise<void> => {
    setState('waiting')
    setError(null)

    try {
      const [, orderRes] = await Promise.all([
        isDelegated() ? Promise.resolve() : initDelegationProcess(),
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ strategy }),
        }),
      ])

      if (!orderRes.ok) throw new Error('Order submission failed')

      const { orderId } = await orderRes.json()
      await pollForConfirmation(orderId)
      setState('confirmed')
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const pollForConfirmation = (orderId: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const deadline = Date.now() + TIMEOUT_MS

      const tick = async () => {
        if (Date.now() > deadline) {
          return reject(new Error('Timed out waiting for confirmation'))
        }

        const res = await fetch(`/api/orders/${orderId}`)
        const { status } = await res.json()

        if (status === 'confirmed') return resolve()
        if (status === 'failed') return reject(new Error('Order failed'))

        setTimeout(tick, POLL_INTERVAL_MS)
      }

      tick()
    })

  const reset = () => {
    setState('idle')
    setError(null)
  }

  return { state, error, confirm, reset }
}
```

---

## `ConfirmationModal` States

```
idle     → [Confirm] [Cancel] buttons
waiting  → spinner + "Waiting for delegation confirmation…"
confirmed → "Done! Your strategy has been submitted." + [Close]
error    → error message + [Try again] [Cancel]
```

`onClose` after `confirmed` → clears `activeProposal` in `dashboard/page.tsx`.

---

## Backend Changes

### `POST /api/orders`

On receipt, check if delegation materials already exist for the user:

- **Delegation exists** → create order with `status: 'confirmed'` immediately
- **No delegation yet** → create order with `status: 'pending'`, wait for webhook

```ts
// handler pseudocode
const hasDelegation = await walletService.hasDelegation(userId)
const status = hasDelegation ? 'confirmed' : 'pending'
const order = await ordersService.create({ userId, strategy, status })
return { orderId: order.id }
```

Frontend polling works identically either way — it just resolves on the first tick if already confirmed.

### `GET /api/orders/:id`

Returns current order status for polling.

```ts
// returns
{ orderId: string; status: 'pending' | 'confirmed' | 'failed' }
```

### Delegation Webhook Handler (`wallet.delegation.created`)

After storing delegation materials, resolve any pending orders for the user:

```ts
await ordersService.confirmPendingOrders(userId)
// sets status: 'confirmed' on all pending orders for this userId
```

---

## Timeout Behavior

- After 30s without `confirmed` status, polling rejects
- Modal shows error: "Timed out waiting for confirmation — please try again"
- Proposal is **not** cleared so the user can retry

---

## File Changes

```
frontend/src/
├── hooks/
│   └── use-proposal-confirmation.ts   ← new
└── components/
    └── confirmation-modal.tsx          ← wire useProposalConfirmation, add waiting/confirmed/error states
```

---

## Tasks

- [ ] Implement `useProposalConfirmation` hook with polling + timeout
- [ ] Update `ConfirmationModal` — idle / waiting / confirmed / error states
- [ ] Update `dashboard/page.tsx` — clear `activeProposal` on confirmed close
- [ ] Update `POST /api/orders` — check delegation exists; create `confirmed` order if so, `pending` if not; return `orderId`
- [ ] Add `WalletService.hasDelegation(userId)` — returns bool, used by orders handler
- [ ] Add `GET /api/orders/:id` — return order status
- [ ] Update delegation webhook handler — call `confirmPendingOrders(userId)` after storing delegation
