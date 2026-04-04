declare module '@dynamic-labs-wallet/node-evm' {
  export interface ServerKeyShare {
    pubkey: { x: string; y: string };
    secretShare: string;
  }

  export interface DelegatedEvmWalletClient {
    readonly chainName: 'EVM';
    [key: string]: unknown;
  }

  export interface CreateDelegatedEvmWalletClientConfig {
    environmentId: string;
    apiKey: string;
    baseApiUrl?: string;
    baseMPCRelayApiUrl?: string;
    debug?: boolean;
  }

  export interface DelegatedSignTransactionParams {
    walletId: string;
    walletApiKey: string;
    keyShare: ServerKeyShare;
    transaction: {
      to?: `0x${string}`;
      value?: bigint;
      data?: `0x${string}`;
      chainId?: number;
      nonce?: number;
      gas?: bigint;
      maxFeePerGas?: bigint | null;
      maxPriorityFeePerGas?: bigint | null;
      type?: 'legacy' | 'eip1559' | 'eip2930';
    };
  }

  export function createDelegatedEvmWalletClient(
    config: CreateDelegatedEvmWalletClientConfig,
  ): DelegatedEvmWalletClient;

  export function delegatedSignTransaction(
    client: DelegatedEvmWalletClient,
    params: DelegatedSignTransactionParams,
  ): Promise<string>;
}
