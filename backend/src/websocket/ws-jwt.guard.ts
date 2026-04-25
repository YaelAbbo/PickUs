import type { JWTPayload } from '@/auth/types';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const user = client.data.user as JWTPayload | undefined;

    if (!user) {
      throw new WsException('Unauthorized');
    }

    return true;
  }
}
