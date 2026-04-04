https://ww> ## Documentation Index
> Fetch the complete documentation index at: https://www.dynamic.xyz/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Developer Actions

> Use the delegated materials to act on behalf of the user.

<Info>
  These actions run on your <strong>server</strong> using the decrypted delegated share and per‑wallet API key.
</Info>

## Use the delegated wallet

Once you decrypt and store the delegated materials, you can perform allowed actions scoped to that wallet.

<Tabs>
  <Tab title="EVM">
    Use the EVM helper to act on behalf of the user. `walletApiKey` comes from decrypting `data.encryptedWalletApiKey`; `keyShare` comes from decrypting `data.encryptedDelegatedShare`.

    ```ts  theme={"system"}
    const { createDelegatedEvmWalletClient, delegatedSignMessage } = import('@dynamic-labs-wallet/node-evm');

    const client = createDelegatedEvmWalletClient({
      environmentId,
      apiKey
    });

    const signature = await delegatedSignMessage(client, {
      walletId,
      walletApiKey,
      keyShare,
      message,
    });
    ```
  </Tab>

  <Tab title="SVM">
    Use the SVM helper to act on behalf of the user. `walletApiKey` comes from decrypting `data.encryptedWalletApiKey`; `keyShare` comes from decrypting `data.encryptedDelegatedShare`.

    ```ts  theme={"system"}
    const { createDelegatedSvmWalletClient, delegatedSignMessage } = import('@dynamic-labs-wallet/node-svm');

    const client = createDelegatedSvmWalletClient({
      environmentId,
      apiKey
    });

    const signature = await delegatedSignMessage(client, {
      walletId,
      walletApiKey,
      keyShare,
      message,
    });
    ```
  </Tab>
</Tabs>

<Card title="What's next?" icon="link" color="#4779FE" href="/javascript/wallets/embedded-wallets/mpc/delegated-access/revoking-delegation">
  Learn how revoking delegation works
</Card>

<Tip>
  Want to sponsor gas for delegated transactions from your server? See [Sponsor Gas for Server Wallets (EVM)](/node/wallets/server-wallets/gas-sponsorship).
</Tip>


Built with [Mintlify](https://mintlify.com).

w.dynamic.xyz/docs/javascript/wallets/embedded-wallets/mpc/delegated-access/developer-actions