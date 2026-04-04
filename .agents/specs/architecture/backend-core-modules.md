# Backend Core Modules — Architecture Overview

> Aiwal Backend · NestJS · MVP · April 2026

---

## Module Map

| Module | Purpose | Detail Spec |
|--------|---------|-------------|
| **CommonModule** | Shared infrastructure — guards, decorators, DTOs, interceptors, error handling | [`backend/common-module.md`](../backend/common-module.md) |
| **AuthModule** | Dynamic SDK session validation, JWT issuance, global AuthGuard | [`backend/auth-module.md`](../backend/auth-module.md) |
| **UsersModule** | User CRUD, preset management, wallet mapping, abstract repository pattern | [`backend/users-module.md`](../backend/users-module.md) |
| **WalletModule** | Dynamic delegation webhook, AES-256 at-rest encryption, delegation material access for ExecutionModule | [`backend/wallet-module.md`](../backend/wallet-module.md) |

---

## AppModule Wiring

```typescript
// app.module.ts

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    AuthModule,
    UsersModule,
    // ... future modules
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
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
   │◄── session token ──────      │
   │                              │
   │── POST /api/auth/session ──► │
   │   { sessionToken }          │
   │                              ├── DynamicService.validateSession()
   │                              ├── UsersService.findOrCreate()
   │                              ├── JwtService.sign(payload)
   │◄── { accessToken, user } ── │
   │                              │
   │── GET /api/... ───────────► │
   │   Authorization: Bearer JWT  │
   │                              ├── JwtAuthGuard → verify JWT
   │                              ├── Controller handles request
   │◄── response ─────────────── │
```

---

## Required Packages

```
@nestjs/jwt
@nestjs/config
class-validator
class-transformer
```

No `@nestjs/passport` — unnecessary for single-strategy auth.

---

## Environment Variables

```
JWT_SECRET=              # Random secret for signing JWTs
JWT_EXPIRATION=4h        # Token TTL
DYNAMIC_API_KEY=         # Dynamic SDK server-side API key
DYNAMIC_ENVIRONMENT_ID=  # Dynamic environment ID
```


```
WalletModule → PriceFeedModule → OrdersModule → ExecutionModule
```
