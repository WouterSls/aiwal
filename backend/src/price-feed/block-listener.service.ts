import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ethers } from 'ethers';
import { PriceFeedService, STABLECOINS } from './price-feed.service.js';

@Injectable()
export class BlockListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlockListenerService.name);
  private provider: ethers.WebSocketProvider;

  constructor(
    private priceFeedService: PriceFeedService,
    private eventEmitter: EventEmitter2,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    this.connect();
  }

  private connect() {
    this.provider = new ethers.WebSocketProvider(this.config.get<string>('BASE_WSS_URL')!);

    this.provider.on('block', async () => {
      const watched = new Map(this.priceFeedService.getWatchedOrders());

      const tokenAddresses = [...new Set([...watched.values()].map(({ tokenIn, tokenOut }) => {
        return STABLECOINS.has(tokenIn) ? tokenOut : tokenIn;
      }))];

      const prices = await this.priceFeedService.fetchPrices(tokenAddresses);
      const triggered: string[] = [];

      for (const [orderId, { tokenIn, tokenOut, tradingPriceUsd }] of watched) {
        const isBuy = STABLECOINS.has(tokenIn);
        const tokenToPrice = isBuy ? tokenOut : tokenIn;
        const usdcPrice = prices.get(tokenToPrice);
        if (usdcPrice === undefined) continue;

        const conditionMet = isBuy ? usdcPrice <= tradingPriceUsd : usdcPrice >= tradingPriceUsd;
        if (conditionMet) triggered.push(orderId);
      }

      for (const orderId of triggered) {
        const { tokenIn, tokenOut } = watched.get(orderId)!;
        const isBuy = STABLECOINS.has(tokenIn);
        const usdcPrice = prices.get(isBuy ? tokenOut : tokenIn)!;
        this.eventEmitter.emit('order.condition.met', { orderId, usdcPrice });
        this.priceFeedService.unwatchOrder(orderId);
      }
    });

    (this.provider.websocket as unknown as EventTarget).addEventListener('close', () => {
      this.logger.debug('WebSocket connection closed, reconnecting in 5s');
      setTimeout(() => this.connect(), 5_000);
    });
  }

  onModuleDestroy() {
    this.provider.destroy();
  }
}
