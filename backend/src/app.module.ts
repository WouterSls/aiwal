import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './persistence/database.module.js';
import { CommonModule } from './common/common.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { DynamicAuthGuard } from './auth/guards/dynamic-auth.guard.js';
import { OrdersModule } from './orders/orders.module.js';
import { WalletModule } from './wallet/wallet.module.js';
import { ExecutionModule } from './execution/execution.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    CommonModule,
    AuthModule,
    UsersModule,
    WalletModule,
    OrdersModule,
    ExecutionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: DynamicAuthGuard,
    },
  ],
})
export class AppModule {}
