# AuthModule Spec

> Aiwal Backend · NestJS · MVP · April 2026

## Purpose
Handles authentication via Dynamic SDK session validation, issues JWTs for subsequent requests, and provides the AuthGuard used globally.

## Dependencies
- `@nestjs/jwt` — token signing/verification
- `@nestjs/passport` — NOT used (unnecessary abstraction for single-strategy auth)
- Dynamic SDK server-side — session token validation
- UsersModule — user lookup/creation

## Configuration

```typescript
// auth/auth.module.ts

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION', '4h') },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, DynamicService],
  exports: [JwtModule],
})
export class AuthModule {}
```

## DynamicService

Validates Dynamic SDK session tokens server-side.

```typescript
// auth/services/dynamic.service.ts

@Injectable()
export class DynamicService {
  constructor(private config: ConfigService) {}

  /**
   * Validates a Dynamic SDK session token by calling Dynamic's API.
   * Returns the Dynamic user ID and wallet address if valid.
   * Throws UnauthorizedException if invalid.
   */
  async validateSession(sessionToken: string): Promise<{
    dynamicId: string;
    walletAddress: string;
    email?: string;
  }>;
}
```

## AuthService

Orchestrates login: validates Dynamic session, finds/creates user, issues JWT.

```typescript
// auth/auth.service.ts

@Injectable()
export class AuthService {
  constructor(
    private dynamicService: DynamicService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Full login flow:
   * 1. Validate Dynamic session token
   * 2. Find or create user in DB
   * 3. Issue JWT with user context
   */
  async login(sessionToken: string): Promise<{
    accessToken: string;
    user: UserResponseDto;
  }>;

  /**
   * Verify an existing JWT and return the payload.
   * Used by AuthGuard.
   */
  async verifyToken(token: string): Promise<JwtPayload>;
}
```

**JWT Payload (lean — no mutable claims like preset):**
```typescript
{
  sub: "user-uuid",
  dynamicId: "dyn_abc123",
  walletAddress: "0x..."
}
```

> `preset` is stored in the DB and read via `UsersService` when needed (e.g. by AgentModule for context assembly). Keeping it out of the token avoids stale claims when the user changes preset mid-session.

## JwtAuthGuard

Global guard applied to all routes by default. Routes opt out via `@Public()` decorator.

```typescript
// auth/guards/jwt-auth.guard.ts

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Check for @Public() metadata → skip auth
    // 2. Extract Bearer token from Authorization header
    // 3. Verify JWT via jwtService.verify()
    // 4. Attach payload to request.user
    // 5. Throw UnauthorizedException if invalid/missing
  }
}
```

> See CommonModule spec for the `@Public()` decorator definition.

## AuthController

```typescript
// auth/auth.controller.ts

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/session
   * Body: { sessionToken: string }
   * Response: { accessToken: string, user: UserResponseDto }
   *
   * Frontend calls this after Dynamic SDK login.
   * Validates Dynamic session, creates user if needed, returns JWT.
   */
  @Public()
  @Post('session')
  async createSession(@Body() dto: CreateSessionDto): Promise<{
    accessToken: string;
    user: UserResponseDto;
  }>;

}
```

## DTOs

```typescript
// auth/dto/create-session.dto.ts

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionToken: string;
}
```

## Global Guard Registration

```typescript
// app.module.ts — register AuthGuard globally

providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

## Auth Flow Diagram

```
Frontend                       Backend
   │                              │
   │── Dynamic SDK login ──►      │
   │◄── session token ──────      │
   │                              │
   │── POST /api/auth/session ──► │
   │   { sessionToken }          │
   │                              ├── DynamicService.validateSession()
   │                              │      → calls Dynamic API
   │                              ├── UsersService.findOrCreate()
   │                              ├── JwtService.sign(payload)
   │                              │
   │◄── { accessToken, user } ── │
   │                              │
   │── GET /api/chat ──────────► │
   │   Authorization: Bearer JWT  │
   │                              ├── JwtAuthGuard.canActivate()
   │                              │      → verify JWT, attach to req.user
   │                              ├── Controller handles request
   │◄── response ─────────────── │
```

## File Structure
```
src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── services/
│   └── dynamic.service.ts
├── guards/
│   └── jwt-auth.guard.ts
└── dto/
    └── create-session.dto.ts
```
