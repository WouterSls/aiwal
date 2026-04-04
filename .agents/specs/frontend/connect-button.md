# Connect Button Spec

> Replaces the mock `ConnectButton` with real Dynamic JS SDK auth — email OTP + social login via a custom modal.

---

## Overview

Clicking "Connect" opens a custom modal. The modal offers two auth paths: email OTP and social login. No Dynamic pre-built widget or modal is used — the JS SDK is headless and all UI is custom-built.

---

## Files

```
frontend/src/
├── components/
│   ├── connect-button.tsx        # Trigger button — opens auth modal
│   ├── auth-modal.tsx            # Custom modal with email + social tabs
│   └── otp-input.tsx             # OTP code input step (shown after email submit)
└── app/
    └── page.tsx                  # Mounts userChanged listener + OAuth redirect detection inline
```

---

## Auth Flow

### Email OTP

1. User enters email, submits
2. Call `sendEmailOTP({ email })` → returns `otpVerification` directly (not destructured)
3. Show OTP input step within the same modal
4. User enters 6-digit code
5. Call `verifyOTP({ otpVerification, otp: code })`
6. On success → `userChanged` fires → post-auth logic runs

### Social Login (redirect-based)

1. User clicks Google or Discord button
2. Call `authenticateWithSocial({ provider, redirectUrl: window.location.origin })`
3. Page redirects to OAuth provider — modal is gone
4. User completes OAuth, lands back on `/`
5. On page mount, `detectOAuthRedirect` detects the return → `completeSocialAuthentication` completes auth
6. `userChanged` fires → post-auth logic runs

---

## Post-Auth Logic (`userChanged` listener in `page.tsx`)

Fires once `userChanged` emits a non-null user. Runs for both email and social paths.

```
1. getChainsMissingWaasWalletAccounts()
2. createWaasWalletAccounts({ chains: missing })   ← call unconditionally, even if list seems non-empty
3. getWalletAccounts() → accounts[0].address
4. POST /api/presets?userId=<user.userId>&walletAddress=<address>
   → 200 with preset  →  router.push('/dashboard')
   → 404 / no preset  →  router.push('/onboard')
```

Use `onEvent({ event: 'userChanged', listener }, dynamicClient)` from `@dynamic-labs-sdk/client`. Clean up by calling the returned function on unmount.

> **Note:** `user.userId` field name needs verification against the actual Dynamic user object shape at runtime. If incorrect, inspect the `user` object from the `userChanged` payload.

---

## OAuth Redirect Detection (inline in `page.tsx`)

Run on every page mount alongside the `userChanged` listener:

```ts
import { detectOAuthRedirect, completeSocialAuthentication } from '@dynamic-labs-sdk/client'

useEffect(() => {
  const url = new URL(window.location.href)
  detectOAuthRedirect({ url }).then(isReturning => {
    if (isReturning) completeSocialAuthentication({ url })
  })
}, [])
```

`completeSocialAuthentication` resolves auth → `userChanged` fires → post-auth logic handles the rest.

---

## Error Handling

**All auth errors surface as toasts.** Use sonner:

```ts
import { toast } from 'sonner'
toast.error('message')
```

Error messages:

| Scenario | Toast message |
|---|---|
| Invalid / expired OTP | "Invalid code. Please try again." |
| Email send failed | "Failed to send code. Try again." |
| Social auth failed / cancelled | "Social login failed. Try again." |
| Preset API call failed | "Something went wrong. Please reconnect." |
| Rate limit hit (3 attempts / 10 min) | "Too many attempts. Wait a moment." |

---

## Components

### `ConnectButton`

- Same outlined style as existing mock
- On click: sets local `open` state to `true`, renders `<AuthModal>`
- No auth logic lives here

```tsx
<button onClick={() => setOpen(true)} ...>Connect</button>
<AuthModal open={open} onClose={() => setOpen(false)} />
```

### `AuthModal`

Custom modal (not Dynamic's). Two sections:

**Email section**
- Input: email address
- Submit button: "Send code"
- After `sendEmailOTP` succeeds → unmount email input, mount `<OtpInput>`

**Social section**
- Buttons for: Google, Discord
- Each button calls `authenticateWithSocial({ provider, redirectUrl: window.location.origin })`
- Loading state per button (disable all while one is in progress)
- Page will redirect — no need to handle modal close

**Imports:**
```ts
import { sendEmailOTP, verifyOTP, authenticateWithSocial, type SocialProvider } from '@dynamic-labs-sdk/client'
```

Provider values are plain strings: `'google'`, `'discord'`. No `ProviderEnum` needed.

### `OtpInput`

- 6-digit code input
- Submit button: "Verify"
- On submit: calls `verifyOTP({ otpVerification, otp: code })`
- Back button: returns to email step (discards `otpVerification`)

---

## `page.tsx` structure

Two `useEffect` blocks, both mounted once on page load:

1. `userChanged` listener — handles post-auth redirect logic
2. OAuth redirect detection — handles social login return

```ts
// WaaS imports
import { getChainsMissingWaasWalletAccounts, createWaasWalletAccounts } from '@dynamic-labs-sdk/client/waas'
import { getWalletAccounts, onEvent, detectOAuthRedirect, completeSocialAuthentication } from '@dynamic-labs-sdk/client'
```

---

## Tasks

- [ ] Install sonner if not already present: `npx shadcn@latest add sonner`
- [ ] Build `AuthModal` with email + social sections
- [ ] Build `OtpInput` step — shown after email submit
- [ ] Wire `ConnectButton` to open `AuthModal`
- [ ] Update `page.tsx`: add OAuth redirect detection + full post-auth logic (WaaS creation, wallet fetch, preset API, redirect)
- [ ] Replace mock `ConnectButton` logic with modal trigger
- [ ] Add toast error handling for all failure cases
