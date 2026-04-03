# Frontend Setup Spec

> Aiwal MVP — Project scaffolding & folder structure

---

## Overview

This spec defines how to set up the `frontend/` directory as an independent Next.js 16 project. It covers scaffolding, folder structure, dependencies, environment config, and dev workflow. The frontend is fully independent from the server — no workspace linking, no shared packages.

---

## Monorepo Strategy

**Flat root, independent packages:**

```
aiwal/
├── frontend/         # Next.js 16 (this spec)
├── server/           # Express/NestJS backend (separate spec)
├── CLAUDE.md
├── AGENTS.md
├── ERP.md
└── package.json      # Root — not a workspace root, just repo metadata
```

- `frontend/` and `server/` each have their own `package.json`, `node_modules`, and scripts.
- No pnpm/npm workspaces. Each is installed and run independently.
- Shared types are copy-pasted where needed (MVP trade-off — few types, low drift risk).
- Root `package.json` stays as repo metadata only — no workspace config.

**Why flat over `apps/`:** Fewer directories to navigate, no workspace tooling overhead. For an MVP with two packages, the extra `apps/` layer adds nothing.

---

## Scaffolding

### Init Command

```bash
cd aiwal/
npx create-next-app@latest frontend \
  --ts \
  --app \
  --tailwind \
  --src-dir \
  --import-alias "@/*" \
```

Flags explained:

- `--ts`
- `--app` — App Router
- `--tailwind` — Tailwind CSS pre-configured
- `--src-dir` — puts code under `frontend/src/`
- `--import-alias "@/*"` — clean imports (`@/components/header`)

### Post-Scaffold Steps

1. Install shadcn/ui:

   ```bash
   cd frontend
   npx shadcn@latest init
   ```

   Accept defaults (New York style, neutral base color).

2. Install React Query:

   ```bash
   npm install @tanstack/react-query
   ```

3. Install Dynamic SDK:

   ```bash
   npm install @dynamic-labs/sdk-api@0.0.924 @dynamic-labs/sdk-evm@0.23.2
   ```

   Refer to `.agents/skills/dynamic-wallet` for additional setup.

4. Create `.env.local`:
   ```bash
   echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
   ```

---

## Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout, providers (QueryClient, Dynamic)
│   │   ├── page.tsx              # Landing / login
│   │   ├── onboard/
│   │   │   └── page.tsx          # Preset selection
│   │   └── dashboard/
│   │       └── page.tsx          # Main trading interface
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components (button, dialog, input, etc.)
│   │   ├── header.tsx
│   │   └── footer.tsx
│   └── lib/
│       ├── api.ts                # React Query hooks (usePortfolio, usePrices, etc.)
│       ├── claude.ts             # Claude API client + streaming
│       └── dynamic.ts            # Dynamic SDK config
├── public/                       # Static assets (logo, icons)
├── .env.local                    # Local env vars (git-ignored)
├── tsconfig.json                 # Path aliases
├── components.json               # shadcn/ui config
├── next.config.ts                # Next.js config
├── tailwind.config.js            # Tailwind config
├── postcss.config.mjs            # PostCSS config
└── package.json
```

### Conventions

- **Pages and layouts** use `.tsx` extension (they return JSX)
- **Components** use `.tsx` extension
- **Lib files** use `.ts` extension
- **Import alias:** `@/components/header` resolves to `src/components/header.tsx`

---

## Environment Variables

| Variable              | Value (dev)             | Description          |
| --------------------- | ----------------------- | -------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend API base URL |

Additional env vars (Dynamic keys, etc.) will be added as those integrations are built. For now, only the API URL is needed.

---

## Dev Workflow

### Starting the frontend

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

### Starting the backend (separate terminal)

```bash
cd server
npm run dev
# → http://localhost:8080
```

No orchestration tool needed — just two terminals. If convenience is wanted later, add a root-level script or use something like `concurrently`.

---

## Root .gitignore Additions

```gitignore
# Dependencies
node_modules/

# Next.js
frontend/.next/
frontend/out/

# Environment
.env.local
.env*.local
```

---

## Dependencies (frontend/package.json)

### Production

| Package                           | Purpose                 |
| --------------------------------- | ----------------------- |
| `next` (16.2.x)                   | Framework               |
| `react`, `react-dom`              | UI library              |
| `@tanstack/react-query`           | Server state management |
| `@dynamic-labs/sdk-api` (0.0.924) | Auth SDK                |
| `@dynamic-labs-sdk/evm` (0.23.2)  | EVM wallet connector    |

### Dev

| Package       | Purpose        |
| ------------- | -------------- |
| `tailwindcss` | Utility CSS    |
| `postcss`     | CSS processing |

### shadcn/ui

Not an npm dependency — components are copied into `src/components/ui/` via `npx shadcn add <component>`. Installs Radix primitives as needed.

---

## Tasks

- [ ] Run `create-next-app` with flags above
- [ ] Init shadcn/ui
- [ ] Install React Query + Dynamic SDK
- [ ] Create `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8080`
- [ ] Update root `.gitignore`
- [ ] Verify `npm run dev` starts on port 3000
- [ ] Set up root layout with QueryClient + Dynamic providers
