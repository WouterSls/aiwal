# Landing Page Spec

> Aiwal MVP — `/` route

---

## Overview

Full-screen centered hero. Pure white background, heavy sans-serif typography. Text-based logo placeholder. Dynamic SDK handles auth via a custom-triggered modal — no pre-built widget rendered on the page.

---

## Layout

Single column, vertically and horizontally centered, full viewport height.

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│            AIWAL                    │
│   next generation of                │
│   wallet automation                 │
│                                     │
│         [ Connect ]                 │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

- No header, no footer, no navigation
- Content block is the only element on the page

---

## Components

### `LandingPage` (`app/page.tsx`)

Page component. Renders the centered content block. Handles Dynamic auth state — redirects on successful login.

**Redirect logic:**

- Auth success + no preset → `/onboard`
- Auth success + preset exists → `/dashboard`

### Content block

```
<logo>      AIWAL           (text, large, heavy weight)
<tagline>   next generation of wallet automation
<cta>       Connect         (outlined button)
```

---

## Typography

| Element | Style                                                                            |
| ------- | -------------------------------------------------------------------------------- |
| Logo    | `font-black`, large (e.g. `text-8xl`), tracking tight, uppercase                 |
| Tagline | `font-light` or `font-normal`, medium size (`text-xl`), tracking wide, lowercase |
| CTA     | `font-medium`, `text-sm`, uppercase, letter-spacing wide                         |

Font: system sans-serif stack (Inter via Next.js font optimization if available).

---

## CTA Button — `ConnectButton`

Custom button component in `components/connect-button.tsx`.

- Style: outlined (`border border-black`, transparent bg, black text)
- On click: calls Dynamic SDK `setShowAuthFlow(true)` to open the auth modal programmatically
- Loading state: button text changes to `Connecting...` after modal closes, while awaiting `user` from Dynamic. Resets to `Connect` if auth fails or is dismissed.
- No spinner — text change only

---

## Auth Integration

Uses Dynamic SDK. The modal is triggered programmatically — no `<DynamicWidget>` rendered on the page.

```ts
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const { setShowAuthFlow, user } = useDynamicContext();
```

On `user` becoming defined (auth success), redirect logic fires via `useEffect`.

---

## File

```
frontend/src/
├── app/
│   └── page.tsx                  # LandingPage — centered hero, redirect logic
└── components/
    └── connect-button.tsx        # Outlined CTA that triggers Dynamic modal
```

---

## Tasks

- [ ] Build `LandingPage` with centered layout
- [ ] Apply typography scale (logo `text-8xl font-black`, tagline `text-xl font-light`)
- [ ] Build `ConnectButton` — outlined style, triggers Dynamic modal on click (mock)
