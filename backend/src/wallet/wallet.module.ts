import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';
import { WebhookService } from './services/webhook.service.js';

@Module({
  imports: [UsersModule],
  controllers: [WalletController],
  providers: [WalletService, WebhookService],
  exports: [WalletService],
})
export class WalletModule {}
