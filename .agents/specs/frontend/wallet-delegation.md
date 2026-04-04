# Wallet Delegation Setup Spec

> Aiwal Frontend · Dynamic JS SDK · MVP · April 2026

## Purpose

After a user connects and lands on the dashboard, prompt them to delegate wallet signing access to the Aiwal backend. Delegation is required before the AI agent can execute trades on their behalf.

---

## Overview

Delegation is triggered on dashboard mount if the user's EVM wallet is not yet delegated. The Dynamic SDK handles the MPC reshare ceremony. Once complete, Dynamic POSTs a `wallet.delegation.created` webhook to the backend — no further client action is needed.

---

## Trigger: `useDelegationGuard` hook

A custom hook that runs once on dashboard mount. It checks delegation status and calls `initDelegationProcess` if needed.

```ts
// hooks/use-delegation-guard.ts
import { useEffect } from 'react'
import { useWalletDelegation } from '@dynamic-labs/sdk-react-core'

export function useDelegationGuard() {
  const { shouldPromptWalletDelegation, initDelegationProcess, delegatedAccessEnabled } = useWalletDelegation()

  useEffect(() => {
    if (!delegatedAccessEnabled) return
    if (shouldPromptWalletDelegation()) {
      initDelegationProcess()
    }
  }, [delegatedAccessEnabled, shouldPromptWalletDelegation, initDelegationProcess])
}
```

Mount in `dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  useDelegationGuard()
  // ...
}
```

`initDelegationProcess` opens the Dynamic-managed delegation modal. No custom UI is needed for the ceremony itself.

---

## Status Check: `useDelegationStatus` hook

Exposes whether the user's EVM wallet is currently delegated. Used to gate trade execution UI.

```ts
// hooks/use-delegation-status.ts
import { useMemo } from 'react'
import { useWalletDelegation } from '@dynamic-labs/sdk-react-core'
import { ChainEnum } from '@dynamic-labs/sdk-api-core'

export function useDelegationStatus() {
  const { getWalletsDelegatedStatus } = useWalletDelegation()

  const statuses = useMemo(() => getWalletsDelegatedStatus(), [getWalletsDelegatedStatus])

  const isDelegated = useMemo(
    () => statuses.some(s => s.chain === ChainEnum.Evm && s.status === 'delegated'),
    [statuses]
  )

  const isPending = useMemo(
    () => statuses.some(s => s.chain === ChainEnum.Evm && s.status === 'pending'),
    [statuses]
  )

  return { isDelegated, isPending }
}
```

---

## Delegation States

| Status | Meaning | Hook value |
|---|---|---|
| `'not_delegated'` | User has never delegated — show prompt | `isDelegated: false`, `isPending: false` |
| `'pending'` | Ceremony in progress — gate trade UI | `isDelegated: false`, `isPending: true` |
| `'delegated'` | Active delegation — trades can execute | `isDelegated: true`, `isPending: false` |

---

## File Structure

```
frontend/src/
└── hooks/
    ├── use-delegation-guard.ts   # Auto-prompts on dashboard mount
    └── use-delegation-status.ts  # Read delegation state
```

---

## Backend Handoff

After the user approves in the Dynamic modal:
1. Dynamic performs the MPC reshare ceremony
2. Dynamic POSTs `wallet.delegation.created` to `POST /api/webhooks/dynamic`
3. Backend decrypts and stores delegation materials

No client-side action is needed after `initDelegationProcess` — the webhook handles the rest.

See [wallet-module.md](../backend/wallet-module.md) for the backend side.

---

## SDK Imports

```ts
import { useWalletDelegation } from '@dynamic-labs/sdk-react-core'
import { ChainEnum } from '@dynamic-labs/sdk-api-core'
```

---

## Tasks

- [ ] Install `@dynamic-labs/sdk-react-core` if not already present
- [ ] Enable Delegated Access in Dynamic dashboard (Embedded Wallets → Delegated Access → ON)
- [ ] Configure RSA public key and webhook endpoint in Dynamic dashboard
- [ ] Implement `useDelegationGuard` hook
- [ ] Implement `useDelegationStatus` hook
- [ ] Mount `useDelegationGuard` in `dashboard/page.tsx`
- [ ] Gate trade execution UI on `isDelegated` in `proposal-editor.tsx` and `confirmation-modal.tsx`
- [ ] Show a loading/disabled state when `isPending` is true during the ceremony
