> ## Documentation Index
> Fetch the complete documentation index at: https://www.dynamic.xyz/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Delegation Flow

> What happens when a user approves delegation and how to handle the webhook.

<Info>
  <strong>Server-only</strong><br />
  This page covers your <strong>server</strong> webhook handler. The client triggers delegation; your server verifies, decrypts, and stores materials.
</Info>

When a delegation is triggered, your endpoint receives a webhook named `wallet.delegation.created`. The delegated materials are in `data`.

```json  theme={"system"}
{
  "messageId": "f44da9f0-a5b5-47f6-965f-f04af51c903e",
  "eventId": "2cf779a8-89da-486f-974e-2b77b738e4ac",
  "eventName": "wallet.delegation.created",
  "timestamp": "2025-10-01T15:13:26.348Z",
  "webhookId": "9a31fefc-64e4-4551-81da-1502eacc852d",
  "userId": "7eb7843b-2a4d-4f69-b95e-d219f0662fda",
  "environmentId": "53728749-1f19-4cab-becf-b88f952c3a3c",
  "environmentName": "sandbox",
  "data": {
    "chain": "EVM",
    "encryptedDelegatedShare": {
      "alg": "HYBRID-RSA-AES-256",
      "iv": "dzePdAUMQd6lWQngEXWPdQ",
      "ct": "pJIT5UU...XcWeYsXhygL2QbQcWZK6Rs5_CuiCDb_dHC_7P1tC...",
      "tag": "Yq8bpMU8huIx7UzUUUgI9Q",
      "ek": "uix2E6E...Keru7HWqeu7ktw"
    },
    "encryptedWalletApiKey": {
      "alg": "HYBRID-RSA-AES-256",
      "ct": "PzeliI...0kB9C0",
      "ek": "iWJgZQ...rxt",
      "iv": "RpC5nw1b4udgJqnC1p0evQ",
      "kid": "dynamic_rsa_lSuvWlCy",
      "tag": "-ZtmOG6gYTzS53wVMNK0Ig"
    },
    "publicKey": "0xd74ff800a3c6f66ecd217118aaa6fb1c916fa4e2",
    "userId": "7eb7843b-2a4d-4f69-b95e-d219f0662fda",
    "walletId": "25193936-3ecd-4c1b-84e6-9eabc82e53c2"
  }
}
```

### Verify → Decrypt → Store

1. **Verify the webhook signature.** Use your webhook secret and the `x-dynamic-signature-256` header: compute HMAC-SHA256 of the raw request body with the secret and compare to the header value in constant time. Only proceed if the signature is valid.

```typescript  theme={"system"}
import * as crypto from "crypto";

export const verifySignature = ({
  secret,
  signature,
  payload,
}: { secret: string; signature: string; payload: any }) => {
  const payloadSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
  const trusted = Buffer.from(`sha256=${payloadSignature}`, "ascii");
  const untrusted = Buffer.from(signature, "ascii");
  return crypto.timingSafeEqual(trusted, untrusted);
};
```

<Note>
  The payload you pass to `verifySignature` must match exactly how it was sent (same JSON structure); otherwise verification will fail.
</Note>

2. Decrypt `data.encryptedDelegatedShare` and `data.encryptedWalletApiKey`.
3. Store `userId`, `walletId`, and decrypted materials securely (e.g., envelope encryption, KMS, at-rest encryption).

<Info>
  <strong>Encryption fields</strong><br />
  `alg`: hybrid (RSA‑OAEP + AES‑256‑GCM); `iv`: AES IV; `ct`: ciphertext; `tag`: GCM tag; `ek`: encrypted content‑encryption key; `kid`: key identifier for rotation.
</Info>

### Example: Node (using Dynamic SDK)

We provide a helper function to handle decryption for you. Install the SDK:

```bash  theme={"system"}
npm install @dynamic-labs-wallet/node
```

Then use the `decryptDelegatedWebhookData` function:

```ts  theme={"system"}
import { decryptDelegatedWebhookData } from '@dynamic-labs-wallet/node';

// In your webhook handler, after verifying the signature
const webhookData = req.body; // The webhook payload

const { decryptedDelegatedShare, decryptedWalletApiKey } =
  decryptDelegatedWebhookData({
    privateKeyPem: process.env.YOUR_PRIVATE_KEY, // Your RSA private key
    encryptedDelegatedKeyShare: webhookData.data.encryptedDelegatedShare,
    encryptedWalletApiKey: webhookData.data.encryptedWalletApiKey,
  });

// Now securely store these decrypted materials
// decryptedDelegatedShare: ServerKeyShare object
// decryptedWalletApiKey: string
```

<Info>
  If a delivery fails, you can replay it from the dashboard. Use the `eventId` as an idempotency key.
</Info>

***

<CardGroup cols={2}>
  <Card title="Storage Best Practices" icon="lock" color="#4779FE" href="/react/wallets/embedded-wallets/mpc/delegated-access/storage-best-practices">
    Learn how to securely store decrypted delegated materials.
  </Card>

  <Card title="Developer Actions" icon="link" color="#4779FE" href="/javascript/wallets/embedded-wallets/mpc/delegated-access/developer-actions">
    Learn how to use the delegated materials.
  </Card>
</CardGroup>


Built with [Mintlify](https://mintlify.com).