import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { ExecutionService } from './execution.service';

@Module({
  imports: [WalletModule],
  providers: [ExecutionService],
})
export class ExecutionModule {}
