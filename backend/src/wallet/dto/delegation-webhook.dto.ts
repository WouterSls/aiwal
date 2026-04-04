import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DelegationWebhookData {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsString()
  @IsNotEmpty()
  encryptedDelegatedShare: string;

  @IsString()
  @IsNotEmpty()
  encryptedWalletApiKey: string;
}

export class DelegationWebhookPayload {
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @ValidateNested()
  @Type(() => DelegationWebhookData)
  data: DelegationWebhookData;
}
