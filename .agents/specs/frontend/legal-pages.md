# Legal Pages Specification

> Aiwal — Privacy Policy (`/privacy`) and Terms of Service (`/terms`)

---

## Overview

Two standalone routes containing static legal content. Both pages share the same layout: header present, no footer, no sidebar. Content is full-width single-column prose.

Legal entity: **Senter Software Solutions**
Product: **Aiwal**
Jurisdiction: **European Union — MiCA framework (Belgium for MVP)**

---

## Routes

| Route      | Title           |
| ---------- | --------------- |
| `/privacy` | Privacy Policy  |
| `/terms`   | Terms of Service |

---

## Layout

```
┌──────────────────────────────────────────┐
│  AIWAL                    [ Connect ]    │  ← Header (existing component)
├──────────────────────────────────────────┤
│                                          │
│  PRIVACY POLICY                          │  ← h1, heading typography
│                                          │
│  Last updated: April 4, 2026             │  ← label typography
│                                          │
│  Section heading                         │  ← h2
│  Body text...                            │
│                                          │
└──────────────────────────────────────────┘
```

- Header: existing `<Header />` component from `components/header.tsx`
- No footer on legal pages
- Page body: `max-w-3xl mx-auto px-6 md:px-10 py-24`
- Top padding accounts for fixed header height

---

## Typography mapping

| Element         | Classes                                           |
| --------------- | ------------------------------------------------- |
| Page title (h1) | `text-4xl font-bold tracking-tight uppercase`     |
| Last updated    | `text-sm font-medium tracking-widest uppercase`   |
| Section heading (h2) | `text-xl font-bold tracking-tight uppercase` |
| Body copy       | `text-base font-normal`                           |
| Inline emphasis | `font-medium` (no italic)                         |

Spacing between sections: `mt-10` per section block.

---

## Files

```
frontend/src/
└── app/
    ├── privacy/
    │   └── page.tsx
    └── terms/
        └── page.tsx
```

Both are Server Components — static, no client interactivity.

---

## Privacy Policy — `/privacy`

### Content

**1. Introduction**
Senter Software Solutions ("we", "us") operates Aiwal, an onchain wallet automation tool. This policy explains what data we collect when you use Aiwal.

**2. What We Collect**
- Your wallet address, as provided when you connect your wallet.
- Onchain activity initiated through Aiwal (e.g. swaps, limit orders executed on your behalf).

We do not collect: email addresses, names, identity documents, or any off-chain personal information.

**3. Why We Collect It**
- To execute delegated onchain actions you have authorized.
- To display your transaction history within the application.

**4. What We Do Not Do**
- We do not sell your data.
- We do not share your wallet address or activity with third parties beyond what is required to settle transactions on-chain (which is inherently public).
- We do not use your data for advertising.

**5. Onchain Data**
All onchain activity is public by nature of the blockchain. Aiwal does not control or obscure data recorded on-chain.

**6. Delegated Execution**
Aiwal holds delegated execution rights to act on your behalf. We never hold, custody, or control your private keys or funds. You may revoke delegation at any time through the application.

**7. Cookies and Tracking**
We do not use cookies or third-party tracking scripts.

**8. Data Retention**
We retain wallet addresses and associated onchain activity for as long as your account is active. You may request deletion of any off-chain records by contacting us.

**9. Your Rights (EU/GDPR)**
Under GDPR you have the right to access, rectify, or erase personal data we hold about you. To exercise these rights, contact: legal@senter.software

**10. Changes**
We may update this policy. Continued use of Aiwal after changes constitutes acceptance.

**11. Contact**
Senter Software Solutions — legal@senter.software

---

## Terms of Service — `/terms`

### Content

**1. Acceptance**
By connecting your wallet to Aiwal, you agree to these Terms of Service. If you do not agree, do not use Aiwal.

**2. About Aiwal**
Aiwal is an onchain automation tool developed by Senter Software Solutions. It executes DeFi actions (including token swaps, limit orders, and future protocol interactions) on your behalf using delegated execution rights you grant.

**3. Non-Custodial**
Aiwal is non-custodial. We never hold your private keys or funds. All execution occurs through smart contract delegation. You retain full ownership of your assets at all times.

**4. Delegated Execution**
By using Aiwal, you grant Senter Software Solutions limited, revocable execution rights to perform onchain actions you configure. You may revoke these rights at any time. You are responsible for all actions executed under your delegation.

**5. Experimental Software**
Aiwal is experimental software provided as-is. DeFi protocols carry inherent risks including smart contract vulnerabilities, price volatility, oracle failures, and liquidity risk. You acknowledge and accept these risks.

**6. No Financial Advice**
Nothing in Aiwal constitutes financial, investment, or trading advice. All decisions are yours. Past performance of any strategy does not guarantee future results.

**7. Supported Actions (MVP)**
The current version of Aiwal supports:
- Token swaps via integrated DEX protocols
- Limit orders

Future versions may support additional DeFi actions. These Terms apply to all current and future functionality.

**8. Prohibited Use**
You may not use Aiwal to:
- Circumvent applicable laws or regulations
- Engage in market manipulation or wash trading
- Access Aiwal if you are subject to sanctions under EU, UN, or applicable national law

**9. Limitation of Liability**
To the maximum extent permitted by law, Senter Software Solutions is not liable for any losses arising from use of Aiwal, including but not limited to: financial losses, failed transactions, smart contract exploits, or protocol failures.

**10. MiCA Compliance**
Senter Software Solutions operates in accordance with the EU Markets in Crypto-Assets Regulation (MiCA) as applicable to software providers. Aiwal does not issue crypto-assets or provide custody services.

**11. Governing Law**
These Terms are governed by the laws of Belgium. Any disputes shall be subject to the exclusive jurisdiction of the courts of Belgium.

**12. Changes**
We may update these Terms. Continued use of Aiwal after changes constitutes acceptance. Material changes will be noted by updating the "Last updated" date.

**13. Contact**
Senter Software Solutions — legal@senter.software

---

## Tasks

- [ ] Create `app/privacy/page.tsx` — static Server Component with Privacy Policy content
- [ ] Create `app/terms/page.tsx` — static Server Component with Terms of Service content
- [ ] Verify `<Header />` renders correctly on both routes (no additional layout changes needed if header is in root layout)
- [ ] Confirm `/privacy` and `/terms` links in footer (`footer.md` row 2) point to correct routes
