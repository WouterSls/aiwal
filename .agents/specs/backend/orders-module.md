# OrdersModule Spec

> Aiwal Backend · NestJS · MVP · April 2026

## Purpose

Manages proposals and orders lifecycle. Accepts proposal creation from the frontend, registers conditional orders with PriceFeedModule, dispatches execution via EventEmitter2, and handles proposal cancellation with cascading order cancellation.

## Dependencies

- `PriceFeedModule` — registers / deregisters conditional orders
- `EventEmitter2` — receives `order.condition.met` from PriceFeedModule; receives `order.executed` from ExecutionModule; emits `order.execute` to ExecutionModule

## Configuration

```typescript
// orders/orders.module.ts

@Module({
  imports: [
    TypeOrmModule.forFeature([ProposalEntity, OrderEntity]),
    PriceFeedModule,
  ],
  controllers: [ProposalsController],
  providers: [
    ProposalsService,
    OrdersService,
    {
      provide: ProposalRepository,
      useClass: TypeOrmProposalRepository,
    },
    {
      provide: OrderRepository,
      useClass: TypeOrmOrderRepository,
    },
  ],
  exports: [ProposalsService, OrdersService],
})
export class OrdersModule {}
```

## Entities

Aligned with the persistence layer spec (`persistence-layer.md`).

```typescript
// orders/proposal.entity.ts

export enum ProposalStatus {
  Accepted = 'accepted',
  Declined = 'declined',
  Cancelled = 'cancelled',
}

export class Proposal {
  id: string;
  userId: string;
  title: string;
  reasoning: string;
  tokenIn: string;
  tokenOut: string;
  status: ProposalStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

```typescript
// orders/order.entity.ts

export enum OrderType {
  Send = 'send',
  Swap = 'swap',
  LimitOrder = 'limit_order',
}

export enum OrderStatus {
  Pending = 'pending',
  Submitted = 'submitted',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export class Order {
  id: string;
  proposalId: string;
  type: OrderType;
  amountIn: string;
  expectedOut?: string;
  to?: string;
  slippageTolerance?: string;
  tradingPriceUsd?: number;
  confirmationHash?: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

## Abstract Repositories

```typescript
// orders/proposal.repository.ts

export abstract class ProposalRepository {
  abstract findById(id: string): Promise<Proposal | null>;
  abstract findByUserId(userId: string): Promise<Proposal[]>;
  abstract create(data: CreateProposalData): Promise<Proposal>;
  abstract updateStatus(id: string, status: ProposalStatus): Promise<Proposal>;
}

export interface CreateProposalData {
  userId: string;
  title: string;
  reasoning: string;
  tokenIn: string;
  tokenOut: string;
}
```

```typescript
// orders/order.repository.ts

export abstract class OrderRepository {
  abstract findById(id: string): Promise<Order | null>;
  abstract findByProposalId(proposalId: string): Promise<Order[]>;
  abstract create(proposalId: string, data: CreateOrderData): Promise<Order>;
  abstract updateStatus(id: string, status: OrderStatus, confirmationHash?: string): Promise<Order>;
  abstract cancelActiveByProposalId(proposalId: string): Promise<void>;
}

export interface CreateOrderData {
  type: OrderType;
  amountIn: string;
  expectedOut?: string;
  to?: string;
  slippageTolerance?: string;
  tradingPriceUsd?: number;
}
```

## ProposalsService

```typescript
// orders/proposals.service.ts

@Injectable()
export class ProposalsService {
  constructor(private repo: ProposalRepository) {}

  async findById(id: string): Promise<Proposal>;
  async findByUserId(userId: string): Promise<Proposal[]>;
  async create(data: CreateProposalData): Promise<Proposal>;
  async updateStatus(id: string, status: ProposalStatus): Promise<Proposal>;
}
```

## OrdersService

Coordinates the full order lifecycle: creation, condition watching, execution dispatch, status resolution, and cancellation.

```typescript
// orders/orders.service.ts

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    private repo: OrderRepository,
    private proposalsService: ProposalsService,
    private priceFeedService: PriceFeedService,
    private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.eventEmitter.on('order.condition.met', this.onConditionMet.bind(this));
    this.eventEmitter.on('order.executed', this.onExecuted.bind(this));
  }

  async findById(id: string): Promise<Order>;
  async findByProposalId(proposalId: string): Promise<Order[]>;

  async createForProposal(proposal: Proposal, orders: CreateOrderData[]): Promise<Order[]>;
  // Creates all orders with status 'pending'.
  // send/swap orders: immediately emit 'order.execute'.
  // limit_order: registers with PriceFeedService.watchOrder(orderId, tokenIn, tokenOut, tradingPriceUsd).

  async cancelProposal(proposalId: string): Promise<void>;
  // Throws BadRequestException if proposal status is 'cancelled' or 'declined'.
  // Sets proposal status to 'cancelled'.
  // Cancels all orders in non-terminal state (pending, submitted).
  // Deregisters any active watchers in PriceFeedService.

  private async onConditionMet(payload: { orderId: string; usdcPrice: number }): Promise<void>;
  // Updates order status to 'submitted'.
  // Emits 'order.execute' with order + proposal context.

  private async onExecuted(payload: { orderId: string; confirmationHash?: string; success: boolean }): Promise<void>;
  // Updates order status to 'completed' or 'failed' with confirmationHash.
}
```

### Execution event payloads

```typescript
// 'order.execute' — emitted by OrdersService, consumed by ExecutionModule
interface OrderExecutePayload {
  orderId: string;
  proposalId: string;
  userId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageTolerance?: string;
}

// 'order.executed' — emitted by ExecutionModule, consumed by OrdersService
interface OrderExecutedPayload {
  orderId: string;
  confirmationHash?: string;
  success: boolean;
}
```

### Order lifecycle flow

```
POST /api/proposals
  │
  ├─ ProposalsService.create()  →  proposal (status: accepted)
  ├─ OrdersService.createForProposal()  →  orders (status: pending)
  │
  ├─ type === 'send' | 'swap'
  │     └─ emit 'order.execute'  →  ExecutionModule
  │
  └─ type === 'limit_order'
        └─ priceFeedService.watchOrder(orderId, tokenIn, tokenOut, tradingPriceUsd)
              │
              └─ on 'order.condition.met'
                    ├─ order.status → 'submitted'
                    └─ emit 'order.execute'  →  ExecutionModule

on 'order.executed'
  ├─ order.status → 'completed' | 'failed'

DELETE /api/proposals/:id
  ├─ proposal.status → 'cancelled'
  ├─ orders (pending | submitted) → 'cancelled'
  └─ priceFeedService.unwatchOrder() for any active limit_order watchers
```

## ProposalsController

```typescript
// orders/proposals.controller.ts

@Controller('api/proposals')
export class ProposalsController {
  constructor(
    private proposalsService: ProposalsService,
    private ordersService: OrdersService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateProposalDto,
  ): Promise<ProposalResponseDto>;
  // throws ConflictException { code: 'DELEGATION_REQUIRED' } if !user.isDelegated()

  @Get()
  async findAll(@CurrentUser('id') userId: string): Promise<ProposalResponseDto[]>;

  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<ProposalResponseDto>;
  // throws NotFoundException if proposal not found or proposal.userId !== userId

  @Get(':id/orders')
  async findOrders(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<OrderResponseDto[]>;
  // throws NotFoundException if proposal not found or proposal.userId !== userId

  @Delete(':id')
  async cancel(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<void>;
  // throws NotFoundException if proposal not found or proposal.userId !== userId
}
```

## DTOs

```typescript
// orders/dto/create-proposal.dto.ts

export class CreateOrderDto {
  @IsEnum(OrderType)
  type: OrderType;

  @IsString()
  amountIn: string;

  @IsOptional()
  @IsString()
  expectedOut?: string;

  @ValidateIf(o => o.type === OrderType.Send)
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  slippageTolerance?: string;

  @ValidateIf(o => o.type === OrderType.LimitOrder)
  @IsNumber()
  tradingPriceUsd?: number;
}

export class CreateProposalDto {
  @IsString()
  title: string;

  @IsString()
  reasoning: string;

  @IsString()
  tokenIn: string;

  @IsString()
  tokenOut: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDto)
  orders: CreateOrderDto[];
}

// orders/dto/proposal-response.dto.ts

export class ProposalResponseDto {
  id: string;
  title: string;
  reasoning: string;
  tokenIn: string;
  tokenOut: string;
  status: ProposalStatus;
  createdAt: Date;
  updatedAt: Date;
}

// orders/dto/order-response.dto.ts

export class OrderResponseDto {
  id: string;
  proposalId: string;
  type: OrderType;
  amountIn: string;
  expectedOut?: string;
  to?: string;
  slippageTolerance?: string;
  tradingPriceUsd?: number;
  confirmationHash?: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

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

## Required Packages

```
@nestjs/event-emitter  // already added by PriceFeedModule
class-transformer      // for @Type() in nested DTO validation
```

## File Structure

```
src/orders/
├── orders.module.ts
├── proposals.controller.ts
├── proposals.service.ts
├── orders.service.ts
├── proposal.entity.ts
├── order.entity.ts
├── proposal.repository.ts
├── order.repository.ts
├── typeorm-proposal.repository.ts
├── typeorm-order.repository.ts
└── dto/
    ├── create-proposal.dto.ts
    ├── proposal-response.dto.ts
    └── order-response.dto.ts
```