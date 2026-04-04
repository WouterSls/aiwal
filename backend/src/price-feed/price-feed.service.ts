import { Injectable } from '@nestjs/common';

@Injectable()
export class PriceFeedService {
  watchOrder(orderId: string, tokenIn: string, tokenOut: string, tradingPriceUsd: number): void {}

  unwatchOrder(orderId: string): void {}
}
