import { BadRequestException, Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';
import { RawBody } from '../common/decorators/raw-body.decorator.js';
import { DelegationWebhookPayload } from './dto/delegation-webhook.dto.js';
import { WalletService } from './wallet.service.js';
import { WebhookService } from './services/webhook.service.js';

@Public()
@Controller('api/webhooks')
export class WalletController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly walletService: WalletService,
  ) {}

  @Post('dynamic')
  @HttpCode(200)
  async handleDelegation(
    @RawBody() rawBody: Buffer,
    @Headers('x-dynamic-signature-256') signature: string,
    @Body() payload: DelegationWebhookPayload,
  ): Promise<void> {
    if (payload.eventName !== 'wallet.delegation.created') {
      throw new BadRequestException(`Unhandled event: ${payload.eventName}`);
    }
    this.webhookService.verifySignature(rawBody, signature);
    const { decryptedDelegatedShare, decryptedWalletApiKey } =
      this.webhookService.decryptMaterials(payload.data);
    await this.walletService.storeDelegation(
      payload.data.userId,
      payload.data.walletId,
      decryptedDelegatedShare,
      decryptedWalletApiKey,
    );
  }
}
