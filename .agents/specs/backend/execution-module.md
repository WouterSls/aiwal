# ExecutionModule Spec

> Aiwal Backend · NestJS · MVP · April 2026

## Purpose

Executes confirmed orders on Uniswap using Dynamic delegated wallets. Listens for `order.execute` events emitted by OrdersModule, fetches swap calldata from the Uniswap API, submits the transaction on Base using the user's delegated signing authority, and emits `order.executed` back to OrdersModule.

## Dependencies

- `WalletModule` — `WalletService.getDecryptedDelegation()`
- `@dynamic-labs-wallet/node` — `createDelegatedEvmWalletClient`
- `EventEmitter2` — receives `order.execute` from OrdersModule; emits `order.executed` back
- Uniswap API — swap calldata for on-chain execution

## Configuration

```typescript
// execution/execution.module.ts

@Module({
  imports: [WalletModule],
  providers: [ExecutionService],
})
export class ExecutionModule {}
```

## ExecutionService

Listens for `order.execute` events, builds and submits the swap transaction, then reports the result back via `order.executed`.

```typescript
// execution/execution.service.ts

@Injectable()
export class ExecutionService implements OnModuleInit {
  constructor(
    private walletService: WalletService,
    private eventEmitter: EventEmitter2,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    this.eventEmitter.on('order.execute', this.onExecute.bind(this));
  }

  private async onExecute(payload: OrderExecutePayload): Promise<void>;
  // 1. WalletService.getDecryptedDelegation(userId) → { dynamicWalletId, delegatedShare, walletApiKey, walletAddress }
  //    Throws NotFoundException if user has no delegation → caught below → emits failure
  // 2. fetchSwapCalldata(tokenIn, tokenOut, amountIn, walletAddress, slippageTolerance)
  //    → { to, value, data }
  // 3. createDelegatedEvmWalletClient({ walletId, walletApiKey, keyShare }) → client
  // 4. client.sendTransaction({ to, value, data }) → confirmationHash
  // 5. emit 'order.executed' with { orderId, confirmationHash, success: true }
  //
  // On any error:
  //   emit 'order.executed' with { orderId, success: false }

  private async fetchSwapCalldata(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    walletAddress: string,
    slippageTolerance?: string,
  ): Promise<{ to: string; value: string; data: string }>;
  // GET {UNISWAP_API_URL}/swap
  //   ?tokenInAddress={tokenIn}
  //   &tokenOutAddress={tokenOut}
  //   &tokenInChainId=8453
  //   &tokenOutChainId=8453
  //   &amount={amountIn}
  //   &type=EXACT_INPUT
  //   &slippageTolerance={slippageTolerance ?? default}
  //   &swapper={walletAddress}
  // Returns swap.transaction: { to, value, data }
}
```

## Event Payloads

```typescript
// 'order.execute' — emitted by OrdersModule, consumed by ExecutionService
interface OrderExecutePayload {
  orderId: string;
  proposalId: string;
  userId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageTolerance?: string;
}

// 'order.executed' — emitted by ExecutionService, consumed by OrdersModule
interface OrderExecutedPayload {
  orderId: string;
  confirmationHash?: string;
  success: boolean;
}
```

## Execution Flow

```
EventEmitter: 'order.execute'
  │
  ├── WalletService.getDecryptedDelegation(userId)
  │     → { dynamicWalletId, delegatedShare, walletApiKey, walletAddress }
  │     throws NotFoundException if no active delegation
  │
  ├── fetchSwapCalldata(tokenIn, tokenOut, amountIn, walletAddress, slippageTolerance)
  │     GET {UNISWAP_API_URL}/swap → { to, value, data }
  │
  ├── createDelegatedEvmWalletClient({
  │     walletId: dynamicWalletId,
  │     walletApiKey,
  │     keyShare: delegatedShare,
  │   })
  │
  ├── client.sendTransaction({ to, value, data })
  │     → confirmationHash
  │
  └── emit 'order.executed' { orderId, confirmationHash, success: true }

On any failure:
  └── emit 'order.executed' { orderId, success: false }
```

## Delegation Check (ProposalsController)

Before writing to DB, ProposalsController validates that the user has an active delegation:

```typescript
// orders/proposals.controller.ts

@Post()
async create(
  @CurrentUser() user: User,
  @Body() dto: CreateProposalDto,
): Promise<ProposalResponseDto> {
  if (!user.isDelegated()) {
    throw new HttpException({ code: 'DELEGATION_REQUIRED' }, HttpStatus.CONFLICT);
  }
  // ... proceed with proposal + order creation
}
```

`req.user` is the full `User` entity attached by `DynamicAuthGuard` — `isDelegated()` is available without any extra DB fetch.

## AppModule Wiring

```typescript
// app.module.ts

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    CommonModule,
    AuthModule,
    UsersModule,
    WalletModule,
    PriceFeedModule,
    OrdersModule,
    ExecutionModule,
  ],
})
export class AppModule {}
```

## Environment Variables

```
UNISWAP_API_URL=   # Uniswap API base URL (shared with PriceFeedModule)
```

## Required Packages

```
@dynamic-labs-wallet/node   # already added by WalletModule
@nestjs/event-emitter        # already added by OrdersModule
```

## File Structure

```
src/execution/
├── execution.module.ts
└── execution.service.ts
```