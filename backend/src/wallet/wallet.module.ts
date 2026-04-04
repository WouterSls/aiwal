import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WebhookService } from './services/webhook.service';

@Module({
  imports: [UsersModule],
  controllers: [WalletController],
  providers: [WalletService, WebhookService],
  exports: [WalletService],
})
export class WalletModule {}
