import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { DynamicService } from './services/dynamic.service';
import { DynamicAuthGuard } from './guards/dynamic-auth.guard';

@Module({
  imports: [UsersModule],
  providers: [DynamicService, DynamicAuthGuard],
  exports: [DynamicAuthGuard],
})
export class AuthModule {}
