# UsersModule Spec

> Aiwal Backend · NestJS · MVP · April 2026

## Purpose
Manages user entities — CRUD operations, preset management, wallet mapping. Uses an abstract `UserRepository` class with an in-memory mock. Teammate swaps in TypeORM later by extending the same abstract class.

## User Entity Shape

Aligned with the persistence layer spec (`persistence-layer.md`).

```typescript
// users/user.entity.ts

export type TradingPreset = 'institutional' | 'degen';

export class User {
  id: string;              // UUID
  dynamicId: string;       // Dynamic SDK user ID (unique)
  walletAddress: string;   // Embedded wallet address on Base
  email?: string;          // From Dynamic SDK (optional)
  preset: TradingPreset;   // 'institutional' | 'degen'
  createdAt: Date;
}
```

## Abstract UserRepository

NestJS injects by class token — no Symbol needed. The abstract class IS the DI token.

```typescript
// users/user.repository.ts

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByDynamicId(dynamicId: string): Promise<User | null>;
  abstract create(data: { dynamicId: string; walletAddress: string; email?: string; preset?: TradingPreset }): Promise<User>;
  abstract updatePreset(id: string, preset: TradingPreset): Promise<User>;
}
```

## MockUserRepository

```typescript
// users/mock-user.repository.ts

@Injectable()
export class MockUserRepository extends UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByDynamicId(dynamicId: string): Promise<User | null> {
    return [...this.users.values()].find(u => u.dynamicId === dynamicId) ?? null;
  }

  async create(data: { dynamicId: string; walletAddress: string; email?: string; preset?: TradingPreset }): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      dynamicId: data.dynamicId,
      walletAddress: data.walletAddress,
      email: data.email,
      preset: data.preset ?? 'degen',
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updatePreset(id: string, preset: TradingPreset): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new NotFoundException('User not found');
    user.preset = preset;
    return user;
  }
}
```

## UsersService

```typescript
// users/users.service.ts

@Injectable()
export class UsersService {
  constructor(private repo: UserRepository) {}

  async findById(id: string): Promise<User>;
  async findByDynamicId(dynamicId: string): Promise<User | null>;
  async findOrCreate(data: { dynamicId: string; walletAddress: string; email?: string; preset?: TradingPreset }): Promise<User>;
  async updatePreset(id: string, preset: TradingPreset): Promise<User>;
}
```

Clean injection — `UserRepository` is the abstract class token, NestJS resolves it to whatever `useClass` provides.

## UsersController

```typescript
// users/users.controller.ts

@Controller('api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser('sub') userId: string): Promise<UserResponseDto>;

  @Patch('me/preset')
  async updatePreset(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdatePresetDto,
  ): Promise<UserResponseDto>;
}
```

## DTOs

```typescript
// users/dto/update-preset.dto.ts

export class UpdatePresetDto {
  @IsIn(['institutional', 'degen'])
  preset: TradingPreset;
}

// users/dto/user-response.dto.ts

export class UserResponseDto {
  id: string;
  walletAddress: string;
  email?: string;
  preset: TradingPreset;
  createdAt: Date;
}
```

## Module Registration

```typescript
// users/users.module.ts

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: UserRepository,         // abstract class as DI token
      useClass: MockUserRepository,    // ← swap to TypeOrmUserRepository later
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
```

## Swap to TypeORM Later

Teammate does:
1. Create TypeORM entity matching `User`
2. Write `TypeOrmUserRepository extends UserRepository` using TypeORM `Repository<UserEntity>`
3. Change `useClass: MockUserRepository` → `useClass: TypeOrmUserRepository`

## File Structure
```
src/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── user.entity.ts
├── user.repository.ts          # abstract class
├── mock-user.repository.ts
└── dto/
    ├── user-response.dto.ts
    └── update-preset.dto.ts
```
