import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const RawBody = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Buffer => {
    const request = ctx.switchToHttp().getRequest<Request & { rawBody: Buffer }>();
    return request.rawBody;
  },
);
