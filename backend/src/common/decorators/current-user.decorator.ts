import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '../../users/user.entity.js';

export const CurrentUser = createParamDecorator(
  (field: keyof UserEntity | undefined, ctx: ExecutionContext): UserEntity | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserEntity;
    return field ? user[field] : user;
  },
);
