import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { DynamicService } from '../services/dynamic.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class DynamicAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dynamicService: DynamicService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) throw new UnauthorizedException('Missing authorization token');

    const { dynamicId, walletAddress } =
      await this.dynamicService.verifyToken(token);

    const user = await this.usersService.findOrCreate({ dynamicId, walletAddress });
    (request as Request & { user: unknown }).user = user;

    return true;
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }
}
