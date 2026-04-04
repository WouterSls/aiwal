import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { DelegatedEvmWalletClient, DelegatedSignTransactionParams, ServerKeyShare } from '@dynamic-labs-wallet/node-evm';
import { JsonRpcProvider } from 'ethers';
import { WalletService } from '../wallet/wallet.service';
import { createDelegatedEvmWalletClient, delegatedSignTransaction } from '@dynamic-labs-wallet/node-evm'

interface OrderExecutePayload {
  orderId: string;
  proposalId: string;
  userId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageTolerance?: string;
}

interface OrderExecutedPayload {
  orderId: string;
  confirmationHash?: string;
  success: boolean;
}

@Injectable()
export class ExecutionService implements OnModuleInit {
  private delegatedClient: DelegatedEvmWalletClient;
  private provider: JsonRpcProvider;
  private signTransaction: (client: DelegatedEvmWalletClient, params: DelegatedSignTransactionParams) => Promise<string>;

  constructor(
    private readonly walletService: WalletService,
    private readonly eventEmitter: EventEmitter2,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    // const { createDelegatedEvmWalletClient, delegatedSignTransaction } = await import('@dynamic-labs-wallet/node-evm');
    this.delegatedClient = createDelegatedEvmWalletClient({
      environmentId: this.config.getOrThrow('DYNAMIC_ENVIRONMENT_ID'),
      apiKey: this.config.getOrThrow('DYNAMIC_API_KEY'),
    });
    this.signTransaction = delegatedSignTransaction;
    this.provider = new JsonRpcProvider(this.config.getOrThrow('BASE_RPC_URL'));
    this.eventEmitter.on('order.execute', this.onExecute.bind(this));
  }

  private async onExecute(payload: OrderExecutePayload): Promise<void> {
    const { orderId } = payload;
    try {
      const { dynamicWalletId, delegatedShare, walletApiKey, walletAddress } =
        await this.walletService.getDecryptedDelegation(payload.userId);

      const keyShare: ServerKeyShare = JSON.parse(delegatedShare);

      const { to, value, data } = await this.fetchSwapCalldata(
        payload.tokenIn,
        payload.tokenOut,
        payload.amountIn,
        walletAddress,
        payload.slippageTolerance,
      );

      const [nonce, feeData] = await Promise.all([
        this.provider.getTransactionCount(walletAddress),
        this.provider.getFeeData(),
      ]);

      const signedTx = await this.signTransaction(this.delegatedClient, {
        walletId: dynamicWalletId,
        walletApiKey,
        keyShare,
        transaction: {
          to: to as `0x${string}`,
          value: BigInt(value),
          data: data as `0x${string}`,
          chainId: 8453,
          nonce,
          gas: 200_000n,
          maxFeePerGas: feeData.maxFeePerGas ?? undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
          type: 'eip1559',
        },
      });

      const txResponse = await this.provider.broadcastTransaction(signedTx);
      const receipt = await txResponse.wait();

      this.emitExecuted({ orderId, confirmationHash: receipt!.hash, success: true });
    } catch {
      this.emitExecuted({ orderId, success: false });
    }
  }

  private async fetchSwapCalldata(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    walletAddress: string,
    slippageTolerance?: string,
  ): Promise<{ to: string; value: string; data: string }> {
    const baseUrl = this.config.getOrThrow('UNISWAP_API_URL');
    const params = new URLSearchParams({
      tokenInAddress: tokenIn,
      tokenOutAddress: tokenOut,
      tokenInChainId: '8453',
      tokenOutChainId: '8453',
      amount: amountIn,
      type: 'EXACT_INPUT',
      slippageTolerance: slippageTolerance ?? '0.5',
      swapper: walletAddress,
    });

    const response = await fetch(`${baseUrl}/swap?${params}`);
    if (!response.ok) {
      throw new Error(`Uniswap API error: ${response.status}`);
    }

    const body = await response.json();
    return body.swap.transaction;
  }

  private emitExecuted(payload: OrderExecutedPayload): void {
    this.eventEmitter.emit('order.executed', payload);
  }
}
