import type { JWTPayload } from '@/auth/types';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Socket } from 'socket.io';

export const WsCurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JWTPayload =>
    ctx.switchToWs().getClient<Socket>().data.user as JWTPayload,
);
