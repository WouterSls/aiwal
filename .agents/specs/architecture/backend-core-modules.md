# Backend Core Modules — Architecture Overview

> Aiwal Backend · NestJS · MVP · April 2026

---

## Module Map

| Module | Purpose | Detail Spec |
|--------|---------|-------------|
| **CommonModule** | Shared infrastructure — guards, decorators, DTOs, interceptors, error handling | [`backend/common-module.md`](../backend/common-module.md) |
| **AuthModule** | Dynamic JWKS token verification, global DynamicAuthGuard, user registration endpoint | [`backend/auth-module.md`](../backend/auth-module.md) |
| **UsersModule** | User CRUD, preset management, abstract repository pattern | [`backend/users-module.md`](../backend/users-module.md) |
| **WalletModule** | Dynamic delegation webhook, AES-256 at-rest encryption, delegation material access | [`backend/wallet-module.md`](../backend/wallet-module.md) |
| **PriceFeedModule** | Uniswap Quoter API prices, Base block listener, limit order condition monitoring | [`backend/pricefeed-module.md`](../backend/pricefeed-module.md) |
| **OrdersModule** | Proposal + order CRUD, market/conditional dispatch, EventEmitter2 execution handoff | [`backend/orders-module.md`](../backend/orders-module.md) |
| **ExecutionModule** | Dynamic delegated wallet, Uniswap swap execution, order.execute event handler | [`backend/execution-module.md`](../backend/execution-module.md) |

---

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
  providers: [
    {
      provide: APP_GUARD,
      useClass: DynamicAuthGuard,
    },
  ],
})
export class AppModule {}
```

---

## Auth Flow

```
Frontend                       Backend
   │                              │
   │── Dynamic SDK login ──►      │
   │◄── authToken ───────────     │
   │                              │
   │── POST /api/auth/register ──►│  (@Public — first login only)
   │   { preset }                 │
   │   Authorization: Bearer      ├── DynamicService.verifyToken()
   │   <Dynamic JWT>              ├── UsersService.create()
   │◄── { user } ────────────────│
   │                              │
   │── GET /api/... ───────────► │
   │   Authorization: Bearer JWT  │
   │                              ├── DynamicAuthGuard → JWKS verify → findByDynamicId
   │                              ├── Controller handles request
   │◄── response ─────────────── │
```

---

## Required Packages

```
@nestjs/config
@nestjs/event-emitter
class-validator
class-transformer
ethers
```

---

## Environment Variables

```
DYNAMIC_ENVIRONMENT_ID=    # Dynamic environment ID
DYNAMIC_JWKS_URI=          # Dynamic JWKS endpoint for token verification
DYNAMIC_WEBHOOK_SECRET=    # HMAC-SHA256 webhook verification
DYNAMIC_RSA_PRIVATE_KEY=   # RSA decryption of delegation materials
DELEGATION_ENCRYPTION_KEY= # 32-byte key for AES-256-GCM at-rest encryption
BASE_WSS_URL=              # WebSocket RPC endpoint for Base
UNISWAP_API_URL=           # Uniswap API base URL
```


```
WalletModule → PriceFeedModule → OrdersModule → ExecutionModule
```
