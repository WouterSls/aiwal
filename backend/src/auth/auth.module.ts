import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { DynamicService } from './services/dynamic.service.js';
import { DynamicAuthGuard } from './guards/dynamic-auth.guard.js';

@Module({
  imports: [UsersModule],
  providers: [DynamicService, DynamicAuthGuard],
  exports: [DynamicService, DynamicAuthGuard],
})
export class AuthModule {}
