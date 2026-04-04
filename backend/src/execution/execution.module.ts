import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module.js';
import { ExecutionService } from './execution.service.js';

@Module({
  imports: [WalletModule],
  providers: [ExecutionService],
})
export class ExecutionModule {}
