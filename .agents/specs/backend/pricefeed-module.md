# PriceFeedModule Spec

> Aiwal Backend · NestJS · MVP · April 2026

## Purpose

Monitors active order conditions by reacting to new Base blocks. On each block, queries the Uniswap Quoter API for each watched token and emits an event to OrdersModule when a condition is met.

## Dependencies

- `ethers` — WebSocket provider for new block events on Base
- `fetch` (native) — HTTP calls to Uniswap Quoter API
- Uniswap Quoter API — official REST API for swap quotes (bounty requirement)
- `@nestjs/config` / `ConfigService` — reads BASE_WSS_URL and UNISWAP_API_URL at runtime

## Configuration

```typescript
// pricefeed/pricefeed.module.ts

@Module({
  providers: [PriceFeedService, BlockListenerService],
  exports: [PriceFeedService],
})
export class PriceFeedModule {}
```

## Environment Variables

```
BASE_WSS_URL=      # WebSocket RPC endpoint for Base (e.g. wss://base-mainnet.g.alchemy.com/v2/...)
UNISWAP_API_URL=   # Uniswap Quoter API base URL
```

## PriceFeedService

Manages the active order watch list and fetches prices via Uniswap Quoter API.

```typescript
// pricefeed/pricefeed.service.ts

const STABLECOINS = new Set<string>([
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
  '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
]);

@Injectable()
export class PriceFeedService {
  private watchedOrders = new Map<string, { tokenIn: string; tokenOut: string; tradingPriceUsd: number }>();

  watchOrder(orderId: string, tokenIn: string, tokenOut: string, tradingPriceUsd: number): void

  unwatchOrder(orderId: string): void

  getWatchedOrders(): Map<string, { tokenIn: string; tokenOut: string; tradingPriceUsd: number }>

  async fetchPrice(tokenAddress: string): Promise<number>

  async fetchPrices(tokenAddresses: string[]): Promise<Map<string, number>>
}
```

### fetchPrice / fetchPrices

`fetchPrice(tokenAddress)` quotes 1 USDC → token via the Uniswap Quoter API and returns `1 / amountOut` (normalized by token decimals) as the token price in USDC.

```
GET {UNISWAP_API_URL}/quote
  ?tokenInAddress=0xUSDC
  &tokenOutAddress={tokenAddress}
  &tokenInChainId=8453
  &tokenOutChainId=8453
  &amount=1000000
  &type=EXACT_INPUT
```

`fetchPrices(tokenAddresses)` deduplicates addresses, calls `fetchPrice` for each unique token in parallel via `Promise.allSettled`, and returns a `Map<tokenAddress, priceInUsdc>`. Rejected fetches are omitted from the map and logged; orders for those tokens are skipped that block.

## BlockListenerService

Subscribes to new block events on Base. On each block, calls `fetchPrice` for every watched token and checks its condition.

```typescript
// pricefeed/block-listener.service.ts

@Injectable()
export class BlockListenerService implements OnModuleInit, OnModuleDestroy {
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
    this.provider = new ethers.WebSocketProvider(this.config.get('BASE_WSS_URL'));

    this.provider.on('block', async () => {
      const watched = new Map(this.priceFeedService.getWatchedOrders()); // snapshot to avoid mutation during iteration

      const tokenAddresses = [...new Set([...watched.values()].map(({ tokenIn, tokenOut }) => {
        const isBuy = STABLECOINS.has(tokenIn);
        return isBuy ? tokenOut : tokenIn;
      }))];
      const prices = await this.priceFeedService.fetchPrices(tokenAddresses);

      const triggered: string[] = [];

      for (const [orderId, { tokenIn, tokenOut, tradingPriceUsd }] of watched) {
        const isBuy = STABLECOINS.has(tokenIn);
        const tokenToPrice = isBuy ? tokenOut : tokenIn;
        const usdcPrice = prices.get(tokenToPrice);
        if (usdcPrice === undefined) continue; // fetch failed for this token, skip

        const conditionMet = isBuy
          ? usdcPrice <= tradingPriceUsd
          : usdcPrice >= tradingPriceUsd;

        if (conditionMet) triggered.push(orderId);
      }

      for (const orderId of triggered) {
        const { tokenIn, tokenOut, tradingPriceUsd } = watched.get(orderId)!;
        const isBuy = STABLECOINS.has(tokenIn);
        const usdcPrice = prices.get(isBuy ? tokenOut : tokenIn)!;
        this.eventEmitter.emit('order.condition.met', { orderId, usdcPrice });
        this.priceFeedService.unwatchOrder(orderId);
      }
    });

    this.provider.websocket.addEventListener('close', () => {
      setTimeout(() => this.connect(), 5_000);
    });
  }

  onModuleDestroy() {
    this.provider.destroy();
  }
}
```

`order.condition.met` payload: `{ orderId, usdcPrice }` — consumed by `OrdersModule` to trigger execution.

## AppModule Wiring

```typescript
// app.module.ts

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    CommonModule,
    AuthModule,
    UsersModule,
    WalletModule,
    PriceFeedModule,
    OrdersModule,
    ExecutionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: DynamicAuthGuard,
    },
  ],
})
export class AppModule {}
```

## Required Packages

```
ethers
@nestjs/event-emitter
@nestjs/config
```

## File Structure

```
src/price-feed/
├── price-feed.module.ts
├── price-feed.service.ts
└── block-listener.service.ts
```

## Tasks

- [ ] Implement `PriceFeedService.watchOrder` — store entry in `watchedOrders` map
- [ ] Implement `PriceFeedService.unwatchOrder` — delete entry from `watchedOrders` map
- [ ] Implement `PriceFeedService.getWatchedOrders` — return `watchedOrders` map
- [ ] Implement `PriceFeedService.fetchPrice` — call Uniswap Quoter API, return `1 / (amountOut / 1e6)` as USD price
- [ ] Implement `PriceFeedService.fetchPrices` — deduplicate, `Promise.allSettled`, return `Map<address, price>`, log and skip rejected
- [ ] Create `block-listener.service.ts` implementing `BlockListenerService` as specced
- [ ] Wire `BlockListenerService` into `price-feed.module.ts` as a provider
- [ ] Add `PriceFeedModule` import to `app.module.ts`
- [ ] Add `BASE_WSS_URL` and `UNISWAP_API_URL` to `.env.local`