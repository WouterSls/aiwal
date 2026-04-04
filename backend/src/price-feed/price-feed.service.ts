import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const STABLECOINS = new Set<string>([
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
  '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
]);

@Injectable()
export class PriceFeedService {
  private watchedOrders = new Map<string, { tokenIn: string; tokenOut: string; tradingPriceUsd: number }>();

  constructor(private config: ConfigService) {}

  watchOrder(orderId: string, tokenIn: string, tokenOut: string, tradingPriceUsd: number): void {
    this.watchedOrders.set(orderId, { tokenIn, tokenOut, tradingPriceUsd });
  }

  unwatchOrder(orderId: string): void {
    this.watchedOrders.delete(orderId);
  }

  getWatchedOrders(): Map<string, { tokenIn: string; tokenOut: string; tradingPriceUsd: number }> {
    return this.watchedOrders;
  }

  async fetchPrice(tokenAddress: string): Promise<number> {
    const baseUrl = this.config.get<string>('UNISWAP_API_URL');
    const params = new URLSearchParams({
      tokenInAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      tokenOutAddress: tokenAddress,
      tokenInChainId: '8453',
      tokenOutChainId: '8453',
      amount: '1000000',
      type: 'EXACT_INPUT',
    });

    const res = await fetch(`${baseUrl}/quote?${params}`);
    if (!res.ok) throw new Error(`Uniswap quote failed: ${res.status}`);
    const data = await res.json() as { quote: { output: { amount: string; currency: { decimals: number } } } };
    const amountOut = Number(data.quote.output.amount);
    const decimals = data.quote.output.currency.decimals;
    return 1 / (amountOut / 10 ** decimals);
  }

  async fetchPrices(tokenAddresses: string[]): Promise<Map<string, number>> {
    const unique = [...new Set(tokenAddresses)];
    const results = await Promise.allSettled(
      unique.map(async (addr) => ({ addr, price: await this.fetchPrice(addr) })),
    );

    const prices = new Map<string, number>();
    for (const result of results) {
      if (result.status === 'fulfilled') {
        prices.set(result.value.addr, result.value.price);
      } else {
        console.error('fetchPrice failed:', result.reason);
      }
    }
    return prices;
  }
}
