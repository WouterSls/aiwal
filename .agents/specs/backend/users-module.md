# UsersModule Spec

> Aiwal Backend · NestJS · MVP · April 2026

## Purpose
Manages user entities — CRUD operations, preset management, wallet mapping. Uses an abstract `UserRepository` class with a TypeORM implementation backed by SQLite (dev) or Postgres (prod).

## User Entity Shape

Aligned with the persistence layer spec (`persistence-layer.md`).

```typescript
// users/user.entity.ts

export type TradingPreset = 'institutional' | 'degen';

export class User {
  id: string;                   // UUID
  dynamicId: string;            // Dynamic SDK user ID (unique)
  walletAddress: string;        // Embedded wallet address on Base
  preset: TradingPreset | null; // null until user completes onboarding
  dynamicWalletId?: string;     // Dynamic walletId from delegation webhook (null until first trade)
  delegatedShare?: string;      // AES-256 encrypted ServerKeyShare JSON (null until delegated)
  walletApiKey?: string;        // AES-256 encrypted wallet API key (null until delegated)
  delegationActive: boolean;    // false until first trade delegation confirmed
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
  abstract create(data: { dynamicId: string; walletAddress: string }): Promise<User>;
  abstract updatePreset(id: string, preset: TradingPreset): Promise<User>;
  abstract updateDelegation(id: string, data: { dynamicWalletId: string; delegatedShare: string; walletApiKey: string }): Promise<User>;
}
```

## TypeOrmUserRepository

```typescript
// users/typeorm-user.repository.ts

@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private repo: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<User | null>;
  async findByDynamicId(dynamicId: string): Promise<User | null>;
  async create(data: { dynamicId: string; walletAddress: string }): Promise<User>;
  async updatePreset(id: string, preset: TradingPreset): Promise<User>;
  async updateDelegation(id: string, data: { dynamicWalletId: string; delegatedShare: string; walletApiKey: string }): Promise<User>;
}
```

> SQLite in dev, Postgres in prod — TypeORM connection config handles the difference. No separate mock needed.

## UsersService

```typescript
// users/users.service.ts

@Injectable()
export class UsersService {
  constructor(private repo: UserRepository) {}

  async findById(id: string): Promise<User>;
  async findByDynamicId(dynamicId: string): Promise<User | null>;
  async findOrCreate(data: { dynamicId: string; walletAddress: string }): Promise<User>;
  async updatePreset(id: string, preset: TradingPreset): Promise<User>;
  async updateDelegation(id: string, data: { dynamicWalletId: string; delegatedShare: string; walletApiKey: string }): Promise<User>;
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
  preset: TradingPreset | null;
  delegationActive: boolean;
  createdAt: Date;
}
```

## Module Registration

```typescript
// users/users.module.ts

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: UserRepository,
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
```

## File Structure
```
src/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── user.entity.ts
├── user.repository.ts
├── typeorm-user.repository.ts
└── dto/
    ├── user-response.dto.ts
    └── update-preset.dto.ts
```
