# Footer Specification

> Landing page only. Multi-column, multi-row editorial footer.

---

## Placement

Rendered exclusively on the landing page (`/`). Not a persistent layout element.

---

## Structure

Two rows:

### Row 1 — Two columns

| Column   | Alignment | Content               |
| -------- | --------- | --------------------- |
| Left     | left      | Mission block         |
| Right    | right     | Legal info block      |

### Row 2 — Single column, centered

Copyright line + navigation links (smaller, subdued).

---

## Content

### Mission block (left)

Label: `AIWAL` — Logo typography (`text-8xl font-black tracking-tight uppercase`)

Tagline below:
> "The next generation of wallet automation. Built for onchain trading and liquidity — without the manual overhead."

Tagline typography: `text-xl font-light tracking-widest lowercase`

### Legal info block (right)

Label: `LEGAL` — Label typography (`text-sm font-medium tracking-widest uppercase`)

Body copy:
> "Aiwal is experimental software. Use at your own risk. Nothing on this platform constitutes financial advice."

Body typography: `text-base font-normal`

### Row 2 — Copyright + links

Copyright: `© 2026 Aiwal. All rights reserved.`

Links (inline, separated by `·`):
- GitHub (`https://github.com/aiwal` — placeholder)
- Terms of Service (`/terms` — placeholder)
- Privacy Policy (`/privacy` — placeholder)

Typography: `text-sm font-medium tracking-widest uppercase`

---

## Layout classes

```
footer: border-t border-black py-24 px-6 md:px-10
row-1: grid grid-cols-2 gap-10
row-2: mt-10 flex flex-col items-center gap-4 text-center
links: flex gap-6
```

---

## Interaction states

- Links: `transition-colors hover:opacity-60` (no underline, no color change — opacity only)
- No icons

---

## Constraints (from design system)

- No rounded corners
- No shadows
- Black/white only
- Top border (`border-t border-black`) is the only structural border
- No decorative elements
