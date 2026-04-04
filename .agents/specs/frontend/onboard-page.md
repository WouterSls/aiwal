# Onboard Page Spec

> Route: `/onboard` — one-time preset selection for new users

---

## Purpose

New users are redirected here after Dynamic login when no user profile exists in the backend. The user picks a trading preset that defines their risk profile and agent behavior. On confirmation, the user record is created and they are redirected to `/dashboard`.

---

## Guard

On mount, before rendering anything:

1. Get wallet address from Dynamic
2. Call `GET /api/users?walletAddress=`
3. If 200 → user already onboarded → redirect to `/dashboard`
4. If 404 → render the page

Do not render any UI until the guard resolves.

---

## Layout

- Header visible (branding via header component)
- No footer
- Centered full-screen content area
- Two preset cards side by side

```
┌─────────────────────────────────────────┐
│                 Header                  │
├─────────────────────────────────────────┤
│                                         │
│        Choose your trading style        │
│                                         │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │ Institutional│  │      Degen       │ │
│  │              │  │                  │ │
│  │  Risk: Low   │  │  Risk: High      │ │
│  │              │  │                  │ │
│  │  [desc]      │  │  [desc]          │ │
│  └──────────────┘  └──────────────────┘ │
│                                         │
│              [ Continue ]               │
│                                         │
└─────────────────────────────────────────┘
```

---

## Presets

### Institutional
- **Risk level:** Low
- **Description:** Conservative strategy focused on blue chip assets. Limited to established tokens with deep liquidity.
- **Allowed tokens note:** Limited to blue chip tokens (shown in card description, not as a separate field)

### Degen
- **Risk level:** High
- **Description:** Aggressive strategy with high risk tolerance. Any token available on Uniswap Base is fair game.

---

## Components

### `PresetCard`

shadcn `Card` component.

| State    | Style                          |
|----------|--------------------------------|
| Default  | Normal card                    |
| Hover    | Lightly enlarged (scale-105)   |
| Selected | Ring/outline (shadcn ring utility) |

Props:
```ts
{
  preset: 'institutional' | 'degen'
  selected: boolean
  onSelect: () => void
}
```

Displays: name, risk level badge, description.

### `OnboardPage`

- Holds `selectedPreset` local state (`'institutional' | 'degen' | null`)
- Renders two `PresetCard` components
- Renders "Continue" button (disabled when no preset selected)
- On Continue click → calls `POST /api/users { walletAddress, preset }` → redirect to `/dashboard`

---

## API Calls

| Call | When | Payload |
|------|------|---------|
| `GET /api/users?walletAddress=` | On mount (guard) | — |
| `POST /api/users` | On Continue confirm | `{ walletAddress: string, preset: 'institutional' \| 'degen' }` |

---

## File

`frontend/src/app/onboard/page.tsx` — page component  
`frontend/src/components/preset-card.tsx` — reusable card component
