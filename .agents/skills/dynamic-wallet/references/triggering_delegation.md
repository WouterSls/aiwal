> ## Documentation Index
> Fetch the complete documentation index at: https://www.dynamic.xyz/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Triggering Delegation

> How to trigger delegation for a user using the JavaScript SDK.

In your application, when a user is logged in, you'll want to request delegation so your server can act on their behalf (for example, to sign transactions or run automated flows).

## Check delegation status

Use `hasDelegatedAccess` to check whether a wallet account already has delegated access before triggering the delegation flow.

```typescript  theme={"system"}
import { getWalletAccounts } from '@dynamic-labs-sdk/client';
import { hasDelegatedAccess } from '@dynamic-labs-sdk/client/waas';

const walletAccounts = getWalletAccounts();
const walletAccount = walletAccounts[0];

const isDelegated = hasDelegatedAccess({ walletAccount });
console.log('Has delegated access:', isDelegated);
```

## Trigger delegation

Use `delegateWaasKeyShares` to initiate the delegation process for a wallet account. This sends the encrypted delegated share to your server via the `wallet.delegation.created` webhook.

```typescript  theme={"system"}
import { getWalletAccounts } from '@dynamic-labs-sdk/client';
import { delegateWaasKeyShares } from '@dynamic-labs-sdk/client/waas';

const walletAccounts = getWalletAccounts();
const walletAccount = walletAccounts[0];

await delegateWaasKeyShares({ walletAccount });
```

### With password encryption

If the wallet uses [password encryption](/javascript/reference/waas/password-encryption), pass the password when delegating. The delegated share will be encrypted with the password before being sent.

```typescript  theme={"system"}
import { getWalletAccounts } from '@dynamic-labs-sdk/client';
import { delegateWaasKeyShares } from '@dynamic-labs-sdk/client/waas';

const walletAccounts = getWalletAccounts();
const walletAccount = walletAccounts[0];

await delegateWaasKeyShares({ walletAccount, password: 'user-password' });
```

<Warning>
  Dynamic does not prompt the user for a password during delegation. If the wallet is password-protected, you must obtain the password in your own UI flow and pass it programmatically.
</Warning>

## Parameters

| Parameter       | Type            | Required | Description                                    |
| --------------- | --------------- | -------- | ---------------------------------------------- |
| `walletAccount` | `WalletAccount` | Yes      | The WaaS wallet account to delegate            |
| `password`      | `string`        | No       | Password for wallets using password encryption |

<Card title="What's next?" icon="link" color="#4779FE" href="/javascript/wallets/embedded-wallets/mpc/delegated-access/receiving-delegation">
  Learn how to receive the delegation materials on your server
</Card>


Built with [Mintlify](https://mintlify.com).