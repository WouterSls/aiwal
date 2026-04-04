import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './persistence/database.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DynamicAuthGuard } from './auth/guards/dynamic-auth.guard';
import { OrdersModule } from './orders/orders.module';
import { WalletModule } from './wallet/wallet.module';
import { ExecutionModule } from './execution/execution.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
