# AuthModule Spec

> Aiwal Backend · NestJS · MVP · April 2026

## Purpose

Verifies Dynamic SDK tokens on every request via JWKS signature check, finds or creates the user, and attaches them to `req.user`. No JWT issuance — Dynamic's token is the auth token.

## Dependencies

- Dynamic SDK JWKS endpoint — token signature verification
- UsersModule — user lookup/creation

## Module

```typescript
// auth/auth.module.ts

@Module({
  imports: [UsersModule],
  providers: [DynamicService, DynamicAuthGuard],
})
export class AuthModule {}
```

## DynamicService

Verifies Dynamic SDK tokens locally using Dynamic's JWKS endpoint. Keys are fetched once and cached.

```typescript
// auth/services/dynamic.service.ts

@Injectable()
export class DynamicService {
  constructor(private config: ConfigService) {}

  /**
   * Verifies a Dynamic SDK token via JWKS signature check (local, cached keys).
   * Returns dynamicId and walletAddress if valid.
   * Throws UnauthorizedException if invalid or expired.
   */
  async verifyToken(token: string): Promise<{
    dynamicId: string;
    walletAddress: string;
  }>;
}
```

> Requires `DYNAMIC_JWKS_URI` env var (e.g. `https://app.dynamicauth.com/api/v0/sdk/<env-id>/.well-known/jwks`).

## DynamicAuthGuard

Global guard. Verifies the Dynamic token and attaches the DB user to `req.user` on every request.

```typescript
// auth/guards/dynamic-auth.guard.ts

@Injectable()
export class DynamicAuthGuard implements CanActivate {
  constructor(
    private dynamicService: DynamicService,
    private usersService: UsersService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check @Public() metadata → skip auth
    // 2. Extract Bearer token from Authorization header
    // 3. DynamicService.verifyToken() → { dynamicId, walletAddress }
    // 4. UsersService.findOrCreate({ dynamicId, walletAddress })
    // 5. Attach user to request.user
    // 6. Throw UnauthorizedException if anything fails
  }
}
```

> See CommonModule spec for the `@Public()` decorator definition.

## Global Guard Registration

```typescript
// app.module.ts

providers: [
  {
    provide: APP_GUARD,
    useClass: DynamicAuthGuard,
  },
],
```

## Auth Flow Diagram

```
User              Frontend                       Backend
 │                    │                              │
 │── connect ────────►│                              │
 │                    │── Dynamic SDK login ──►      │
 │                    │◄── authToken (Dynamic JWT) ──│
 │                    │                              │
 │                    │── GET /api/users/me ────────►│
 │                    │   Authorization: Bearer      │
 │                    │   <Dynamic JWT>              │
 │                    │                              ├── DynamicAuthGuard
 │                    │                              │   ├── JWKS verify (cached)
 │                    │                              │   └── findOrCreate user
 │                    │                              │       → attach to req.user
 │                    │                              ├── Controller handles request
 │                    │◄── { user } ────────────────│
 │                    │                              │
 │                    │  if user.preset === null      │
 │                    │  → redirect to /onboard      │
```

Dynamic SDK auto-refreshes `authToken` before expiry — frontend needs no refresh logic.

## File Structure

```
src/auth/
├── auth.module.ts
├── services/
│   └── dynamic.service.ts
└── guards/
    └── dynamic-auth.guard.ts
```
