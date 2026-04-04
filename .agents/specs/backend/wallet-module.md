# WalletModule Spec

> Aiwal Backend · NestJS · MVP · April 2026

## Purpose

Owns the delegated signing authority lifecycle. Receives Dynamic delegation webhooks, stores encrypted key materials on the user row, and exposes decrypted materials to ExecutionModule at signing time.

## Dependencies

- `@dynamic-labs-wallet/node` — `decryptDelegatedWebhookData`
- `UsersModule` — update delegation fields on user row

## Configuration

```typescript
// wallet/wallet.module.ts

@Module({
  imports: [UsersModule],
  controllers: [WalletController],
  providers: [WalletService, WebhookService],
  exports: [WalletService],
})
export class WalletModule {}
```

## WebhookService

Verifies incoming Dynamic webhook signatures and decrypts delegation materials.

```typescript
// wallet/services/webhook.service.ts

@Injectable()
export class WebhookService {
  constructor(private config: ConfigService) {}

  /**
   * Verifies the HMAC-SHA256 signature from the x-dynamic-signature-256 header.
   * Throws BadRequestException if signature is invalid.
   */
  verifySignature(rawBody: Buffer, signature: string): void;

  /**
   * Decrypts delegation materials from the webhook payload using
   * decryptDelegatedWebhookData from @dynamic-labs-wallet/node.
   * Throws BadRequestException if decryption fails.
   *
   * Returns plaintext delegatedShare and walletApiKey.
   */
  decryptMaterials(payload: DelegationWebhookPayload): {
    decryptedDelegatedShare: string;
    decryptedWalletApiKey: string;
  };
}
```

**Env vars used:**
- `DYNAMIC_WEBHOOK_SECRET` — HMAC-SHA256 verification
- `DYNAMIC_RSA_PRIVATE_KEY` — RSA decryption of delegation materials

## WalletService

Owns AES-256 encryption/decryption of delegation materials and persistence on the user row.

```typescript
// wallet/wallet.service.ts

@Injectable()
export class WalletService {
  constructor(
    private usersService: UsersService,
    private config: ConfigService,
  ) {}

  /**
   * Encrypts delegation materials with AES-256 and upserts them on the user row.
   * Sets delegation_active = true, dynamic_wallet_id, delegated_share, wallet_api_key.
   * Always overwrites — last webhook wins.
   *
   * TODO: deduplicate by eventId to guard against Dynamic webhook retries.
   */
  async storeDelegation(
    userId: string,
    dynamicWalletId: string,
    decryptedDelegatedShare: string,
    decryptedWalletApiKey: string,
  ): Promise<void>;

  /**
   * Fetches the user's encrypted delegation fields from the DB,
   * decrypts them with AES-256, and returns plain materials.
   * Called by ExecutionModule at transaction signing time.
   * Throws NotFoundException if user has no active delegation.
   */
  async getDecryptedDelegation(userId: string): Promise<{
    dynamicWalletId: string;
    delegatedShare: string;
    walletApiKey: string;
  }>;

  private encrypt(plaintext: string): string;
  private decrypt(ciphertext: string): string;
}
```

**Encryption details:**
- Algorithm: AES-256-GCM
- IV: 12 random bytes, generated per encryption
- Stored format (base64): `iv (12B) | authTag (16B) | ciphertext`

**Env vars used:**
- `DELEGATION_ENCRYPTION_KEY` — 32-byte key for AES-256-GCM at-rest encryption

## WalletController

```typescript
// wallet/wallet.controller.ts

@Controller('api/webhooks')
export class WalletController {
  constructor(
    private webhookService: WebhookService,
    private walletService: WalletService,
  ) {}

  /**
   * POST /api/webhooks/dynamic
   *
   * No JWT guard — authentication is HMAC-SHA256 signature verification only.
   * Handles wallet.delegation.created events from Dynamic SDK.
   *
   * Flow:
   * 1. Verify x-dynamic-signature-256 header → 400 if invalid
   * 2. Decrypt delegation materials → 400 if decryption fails
   * 4. Encrypt at rest and upsert onto user row
   * 5. Return 200
   */
  @Public()
  @Post('dynamic')
  async handleDelegationWebhook(
    @Headers('x-dynamic-signature-256') signature: string,
    @RawBody() rawBody: Buffer,
    @Body() body: DelegationWebhookPayload,
  ): Promise<void>;
}
```

> `@RawBody()` is required for HMAC verification — the raw buffer must be used, not the parsed body.

## DTOs

```typescript
// wallet/dto/delegation-webhook.dto.ts

export class DelegationWebhookPayload {
  @IsString()
  @IsNotEmpty()
  eventName: string; // 'wallet.delegation.created'

  data: {
    userId: string;           // Dynamic userId — maps to users.dynamic_id
    walletId: string;         // Dynamic walletId
    encryptedDelegatedShare: string;
    encryptedWalletApiKey: string;
  };
}
```

## Delegation Flow

```
Dynamic SDK (client)            Backend
       │                           │
       │── delegateWaasKeyShares() │
       │                           │
       │    Dynamic Platform       │
       │      sends webhook ──────►│
       │                           ├── WebhookService.verifySignature()  → 400 if invalid
       │                           ├── WebhookService.decryptMaterials() → 400 if fails
       │                           ├── WalletService.encrypt() × 2
       │                           ├── UsersService.updateDelegation()
       │                           │     sets: delegated_share, wallet_api_key,
       │                           │           dynamic_wallet_id, delegation_active = true
       │                           │
       │◄── 200 ──────────────────│
       │                           │
  (later — at trade execution)     │
       │                           │
       │                    ExecutionModule
       │                           ├── WalletService.getDecryptedDelegation(userId)
       │                           │     fetches encrypted fields, decrypts, returns plain materials
       │                           ├── createDelegatedEvmWalletClient(...)
       │                           └── signTransaction(...)
```

## File Structure

```
src/wallet/
├── wallet.module.ts
├── wallet.controller.ts
├── wallet.service.ts
├── services/
│   └── webhook.service.ts
└── dto/
    └── delegation-webhook.dto.ts
```
