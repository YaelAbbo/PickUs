import { ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { WsJwtGuard } from './ws-jwt.guard';

function buildMockContext(
  socketData: Partial<Socket['data']>,
): ExecutionContext {
  const socket = { data: socketData } as Socket;
  return {
    switchToWs: () => ({ getClient: () => socket }),
  } as unknown as ExecutionContext;
}

describe('WsJwtGuard', () => {
  const guard = new WsJwtGuard();

  it('returns true when socket.data.user is populated', () => {
    const ctx = buildMockContext({
      user: { sub: 'user-1', iat: 0, exp: 9999999999 },
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws WsException when socket.data.user is absent', () => {
    const ctx = buildMockContext({});

    expect(() => guard.canActivate(ctx)).toThrow(WsException);
  });
});
