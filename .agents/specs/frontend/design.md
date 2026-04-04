# Frontend Design System

> Aiwal — visual language and component guidelines

---

## Direction

Brutalist minimalism. Black and white only. Typography does the heavy lifting — no decorative elements, no gradients, no shadows. Every screen feels like a high-contrast editorial layout.

---

## Color

| Token     | Value     | Usage                          |
| --------- | --------- | ------------------------------ |
| `black`   | `#000000` | Text, borders, hover fills     |
| `white`   | `#ffffff` | Backgrounds, inverted text     |

No other colors. No grays, no accent colors, no opacity variants beyond interaction states.

---

## Typography

Font: Inter (Next.js font optimization). Fallback: system sans-serif.

| Role    | Classes                                           | Case       |
| ------- | ------------------------------------------------- | ---------- |
| Logo    | `text-8xl font-black tracking-tight`              | UPPERCASE  |
| Heading | `text-4xl font-bold tracking-tight`               | UPPERCASE  |
| Tagline | `text-xl font-light tracking-widest`              | lowercase  |
| Body    | `text-base font-normal`                           | sentence   |
| Label   | `text-sm font-medium tracking-widest`             | UPPERCASE  |

Rules:
- Logo and headings: tight tracking, heavy weight
- Taglines and captions: wide tracking, light weight
- Never mix tracking-tight and tracking-widest in the same typographic block

---

## Spacing

Whitespace is the primary design element. Prefer generous gaps.

- Section padding: `py-24` minimum
- Component gaps: `gap-6` default, `gap-10` for major sections
- Horizontal margins: `px-6` mobile, `px-10` desktop

---

## Buttons

### Outlined (primary)

```
border border-black bg-transparent px-10 py-3
text-sm font-medium uppercase tracking-widest text-black
transition-colors hover:bg-black hover:text-white
disabled:cursor-not-allowed disabled:opacity-50
```

- Default: transparent fill, black border + text
- Hover: invert — black fill, white text
- Disabled: `opacity-50`, not-allowed cursor
- No border-radius — sharp corners only
- No icons unless the label alone is insufficient

### Filled (secondary, use sparingly)

```
bg-black px-10 py-3
text-sm font-medium uppercase tracking-widest text-white
transition-colors hover:bg-white hover:text-black hover:border hover:border-black
```

---

## Inputs

```
border border-black bg-transparent px-4 py-3
text-base font-normal text-black placeholder:text-black/40
focus:outline-none focus:ring-0 focus:border-black
```

- No rounded corners
- No box shadows on focus — border is the only focus indicator
- Placeholder: black at 40% opacity

---

## Layout

- All pages: full viewport height, white background
- Default page layout: single column, centered
- No persistent header or footer unless a route explicitly requires navigation
- Content blocks are the only structural element

---

## Interaction states

- Loading: text change only (e.g. `Connect` → `Connecting...`). No spinners.
- Error: inline text below the triggering element. No toasts, no modals for errors.
- Success: redirect or content swap. No confirmation screens unless data is irreversible.

---

## What to avoid

- Rounded corners (`rounded-*`)
- Drop shadows (`shadow-*`)
- Color outside the black/white palette
- Animations beyond `transition-colors`
- Icons as decoration
- Borders on containers (only buttons and inputs have borders)
