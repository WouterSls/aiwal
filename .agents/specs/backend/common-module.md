# CommonModule Spec

> Aiwal Backend · NestJS · MVP · April 2026

## Purpose
Shared infrastructure used across all backend modules — guards, decorators, DTOs, interceptors, error handling.

## Components

### `@CurrentUser()` Decorator

Parameter decorator that extracts the authenticated user from the request object (set by `DynamicAuthGuard`). `req.user` is the full `User` entity from the DB.

```typescript
// common/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '../../users/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof UserEntity | undefined, ctx: ExecutionContext): UserEntity | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserEntity;
    return data ? user[data] : user;
  },
);
```

**Usage:**
```typescript
@Get('me')
getMe(@CurrentUser() user: User) { ... }

@Get('wallet')
getWallet(@CurrentUser('walletAddress') address: string) { ... }
```

### Shared DTOs

```typescript
// common/dto/api-response.dto.ts

export class ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### HttpExceptionFilter (Global)

Catches all exceptions and normalizes them into `ApiResponse` format.

```typescript
// common/filters/http-exception.filter.ts

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Maps HttpException → { success: false, error: { code, message } }
    // Maps unknown errors → 500 with generic message
    // Logs full error in non-production
  }
}
```

### LoggingInterceptor (Global)

Logs request method, path, status code, and response time.

```typescript
// common/interceptors/logging.interceptor.ts

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // Logs: [POST /api/chat] 200 — 142ms
}
```

### TransformInterceptor (Global)

Wraps all successful responses into `ApiResponse<T>` format automatically.

```typescript
// common/interceptors/transform.interceptor.ts

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  // Wraps controller return value → { success: true, data: <return value> }
}
```

### `@Public()` Decorator

Marks a route as public, opting out of the global `JwtAuthGuard`.

```typescript
// common/decorators/public.decorator.ts

import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### Module Registration

```typescript
// common/common.module.ts

@Module({
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
  exports: [],
})
export class CommonModule {}
```

## File Structure
```
src/common/
├── common.module.ts
├── decorators/
│   ├── current-user.decorator.ts
│   └── public.decorator.ts
├── dto/
│   └── api-response.dto.ts
├── filters/
│   └── http-exception.filter.ts
└── interceptors/
    ├── logging.interceptor.ts
    └── transform.interceptor.ts
```
