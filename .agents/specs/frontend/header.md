# Header Spec

> Aiwal — persistent site header, all routes

---

## Overview

Fixed header present on every route. Differentiates between unauthenticated and authenticated states. Bottom border separates it from page content. Both the header connect button and the landing page connect button trigger the same Dynamic auth flow.

---

## Layout

```
┌─────────────────────────────────────────┐
│  AIWAL                    [ Connect ]   │  ← unauthenticated
├─────────────────────────────────────────┤
│  AIWAL       0x1234...abcd [ Disconnect ]│  ← authenticated
└─────────────────────────────────────────┘
```

- Full width, fixed to top of viewport
- Horizontal padding: `px-6` mobile, `px-10` desktop
- Vertical padding: `py-4`
- Bottom border: `border-b border-black`
- Background: `bg-white`
- `z-index` above page content

---

## States

### Unauthenticated

| Position | Element         |
| -------- | --------------- |
| Left     | AIWAL logo      |
| Right    | Connect button  |

### Authenticated

| Position      | Element              |
| ------------- | -------------------- |
| Left          | AIWAL logo           |
| Right (left)  | Truncated address    |
| Right (right) | Disconnect button    |

Truncated address format: `0x1234...abcd` (first 6 + last 4 chars).

---

## Components

### `Header` (`components/header.tsx`)

Client component. Reads wallet state on mount via `getWalletAccounts()` and subscribes to changes via `onEvent({ event: "walletAccountsChanged" })`. Renders unauthenticated or authenticated layout accordingly.

### Logo

Text-based. Matches landing page logo style: `font-black tracking-tight uppercase`. Smaller than hero — `text-xl` or `text-2xl`. Links to `/` (or no-op if already on `/`).

### Connect button (header)

Reuses `ConnectButton` from `components/connect-button.tsx`. Same outlined style, same `connectAndVerifyWithWalletProvider` call — both header and landing page share the same component and the same auth trigger.

### Disconnect button

Outlined button. On click: calls `logout()` from `@dynamic-labs-sdk/client`. Loading state: text changes to `Disconnecting...`. Resets on error.

```
border border-black bg-transparent px-6 py-2
text-sm font-medium uppercase tracking-widest text-black
transition-colors hover:bg-black hover:text-white
disabled:cursor-not-allowed disabled:opacity-50
```

### Wallet address

Truncated display, non-interactive. Style: `text-sm font-normal tracking-widest`.

Truncation util:

```ts
function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
```

---

## Auth Integration

Uses Dynamic JavaScript SDK (headless — no React hooks).

```ts
import { getWalletAccounts, onEvent, logout } from "@dynamic-labs-sdk/client";
import { dynamicClient } from "@/lib/dynamic";

// Read current state
const accounts = await getWalletAccounts(dynamicClient);
const address = accounts[0]?.address ?? null;

// Subscribe to changes
onEvent({ event: "walletAccountsChanged" }, (accounts) => {
  setAddress(accounts[0]?.address ?? null);
}, dynamicClient);
```

---

## Layout integration

Header is rendered in the root layout (`app/layout.tsx`) above `{children}`. Page content receives top padding equal to header height to prevent overlap.

---

## Files

```
frontend/src/
├── app/
│   └── layout.tsx                  # Renders <Header /> above all pages
└── components/
    ├── header.tsx                  # Header — auth-aware, fixed
    └── connect-button.tsx          # Shared — used by header + landing page
```

---

## Tasks

- [ ] Build `Header` with fixed layout, bottom border, auth state detection
- [ ] Implement `onEvent` subscription for wallet changes
- [ ] Build disconnect button with `logout()` and loading state
- [ ] Add truncated wallet address display
- [ ] Mount `Header` in `app/layout.tsx`
- [ ] Add page body top padding to offset fixed header height
