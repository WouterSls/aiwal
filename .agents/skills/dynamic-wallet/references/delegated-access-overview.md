> ## Documentation Index
>
> Fetch the complete documentation index at: https://www.dynamic.xyz/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Delegated Access Overview

> What delegated access is and how it works at a high level.

Delegated Access allows an application developer to act on behalf of a user. When enabled, the developer receives a cryptographic share and a per-wallet API key that allows limited operations such as signing transactions.

This gives developers the ability to automate flows (e.g. bots, agents, recurring jobs) while keeping the end-user in full control of what's allowed.

<Info>
  You can test delegated access in sandbox environments. For production use, delegated access requires an [Enterprise plan](https://www.dynamic.xyz/talk-to-us).
</Info>

## Supported Chains

Delegated access is currently supported for:

- **EVM** (Ethereum, Polygon, Arbitrum, etc.)
- **Solana**

## Implementation Overview

1. Enable Delegated Access in the dashboard and set defaults.
2. Register your HTTPS endpoint (server) and add your public encryption key.
3. Trigger delegation (client) — auto-prompt on sign in or call the SDK function.
4. Receive webhook → verify signature → decrypt and store materials (server).
5. Use the delegated materials to sign on behalf of the user (server).

## How it works

<Steps>
  <Step title="Developer Setup">
    Developer configures a **secure HTTPS endpoint** (where Dynamic will send encrypted key shares) and provides an **encryption key** (or let's Dynamic generate one) in the dashboard.
  </Step>

  <Step title="Webhook">
    A webhook is automatically created in the Dynamic environment with events `wallet.delegation.created` and `wallet.delegation.revoked`.
  </Step>

  <Step title="User Approval">
    Whenever triggered, the **user is prompted** to approve delegation.
  </Step>

  <Step title="Reshare Ceremony">
    If approved, Dynamic triggers a **reshare ceremony**:

    * User gets a new share.
    * Dynamic generates a new server share.
    * A webhook event is triggered for `wallet.delegation.created` and the developer's endpoint receives data including the **encrypted external share** and **per-wallet API key**.

  </Step>

  <Step title="Secure Storage">
    The developer then decrypts this data and stores it securely (encrypting again on their side is recommended).
  </Step>

  <Step title="Delegated Operations">
    The developer uses our SDK to create a delegated client and perform allowed operations.
  </Step>
</Steps>

<Info>
  Delegated access does not allow exporting private keys, refreshing/resharing, or modifying policies. It is limited to user-approved signing operations.
</Info>

## Glossary

- **Delegated share**: The encrypted MPC key share you decrypt and store on your server.
- **Per-wallet API key**: API key scoped to a single wallet; sent encrypted to your server.
- **Reshare ceremony**: Rotation that issues new user and server shares and produces delegated materials.
- **Delegation prompt**: UI asking the user to approve delegation in your app.

## Security considerations

- **Encryption**: Dynamic encrypts shares before sending. Developers should re-encrypt before storage.
- **Per-wallet API keys**: Each wallet has its own API key, scoped only to that wallet.
- **Limited operations**: Developers cannot reshare, refresh, or export keys.
- **Audits & compliance**: All delegated flows inherit Dynamic's SOC2 and security posture.
- **Endpoint security**: Ensure your delegated access endpoint uses HTTPS and proper authentication.

<Card title="What's next?" icon="link" color="#4779FE" href="/overview/wallets/embedded-wallets/mpc/delegated-access/configuration">
  Dashboard Setup
</Card>

Built with [Mintlify](https://mintlify.com).
