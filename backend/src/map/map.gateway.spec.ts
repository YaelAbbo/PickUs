import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { UserService } from '../user/user.service';
import { WsEvent } from '../websocket/events';
import { MapGateway } from './map.gateway';
import type { LocationUpdatePayload } from './map.types';

const mockUser = { sub: 'user-1', iat: 0, exp: 9999999999 };

function buildMockSocket(overrides: Partial<Socket> = {}): jest.Mocked<Socket> {
  return {
    id: 'socket-id',
    data: {},
    handshake: {
      auth: { token: 'valid.jwt.token' },
      headers: {},
    } as unknown as Socket['handshake'],
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<Socket>;
}

function buildMockServer(): { to: jest.Mock; emit: jest.Mock } {
  const emit = jest.fn();
  const to = jest.fn().mockReturnValue({ emit });
  return { to, emit };
}

function buildGateway(
  jwtVerifyResult: 'valid' | 'throw',
  updateLocationResult: 'ok' | 'throw' = 'ok',
) {
  const jwtService = {
    verifyAsync: jest.fn().mockImplementation(() => {
      if (jwtVerifyResult === 'throw')
        return Promise.reject(new Error('invalid token'));
      return Promise.resolve(mockUser);
    }),
  } as unknown as JwtService;

  const userService = {
    updateLocation: jest.fn().mockImplementation(() => {
      if (updateLocationResult === 'throw')
        return Promise.reject(new Error('db error'));
      return Promise.resolve();
    }),
  } as unknown as UserService;

  const gateway = new MapGateway(jwtService, userService);
  return { gateway, jwtService, userService };
}

describe('MapGateway', () => {
  describe('handleConnection', () => {
    it('disconnects a socket with no token', async () => {
      const { gateway } = buildGateway('valid');
      const client = buildMockSocket({
        handshake: { auth: {}, headers: {} } as unknown as Socket['handshake'],
      });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(client.data.user).toBeUndefined();
    });

    it('disconnects a socket whose token fails verification', async () => {
      const { gateway } = buildGateway('throw');
      const client = buildMockSocket();

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(client.data.user).toBeUndefined();
    });

    it('attaches the decoded user to socket.data on a valid token', async () => {
      const { gateway } = buildGateway('valid');
      const client = buildMockSocket();

      await gateway.handleConnection(client);

      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.data.user).toEqual(mockUser);
    });
  });

  describe('handleRoomJoin', () => {
    it('joins the correct ride room and returns an ack', () => {
      const { gateway } = buildGateway('valid');
      const client = buildMockSocket();
      client.data.user = mockUser;

      const result = gateway.handleRoomJoin(client, 'ride-42', mockUser);

      expect(client.join).toHaveBeenCalledWith('ride:ride-42');
      expect(result).toEqual({ rideId: 'ride-42', status: 'joined' });
    });
  });

  describe('handleRoomLeave', () => {
    it('leaves the correct ride room and returns an ack', () => {
      const { gateway } = buildGateway('valid');
      const client = buildMockSocket();
      client.data.user = mockUser;

      const result = gateway.handleRoomLeave(client, 'ride-42', mockUser);

      expect(client.leave).toHaveBeenCalledWith('ride:ride-42');
      expect(result).toEqual({ rideId: 'ride-42', status: 'left' });
    });
  });

  describe('handleLocationUpdate', () => {
    const geometry = { type: 'Point', coordinates: [34.8516, 31.0461] };

    it('persists the location to the user record', async () => {
      const { gateway, userService } = buildGateway('valid');
      const mockServer = buildMockServer();
      gateway.server = mockServer as unknown as Server;

      await gateway.handleLocationUpdate(
        { geometry, rideId: 'ride-42' },
        mockUser,
      );

      expect(userService.updateLocation).toHaveBeenCalledWith(
        mockUser.sub,
        geometry,
      );
    });

    it('broadcasts location:updated to the ride room when rideId is provided', async () => {
      const { gateway } = buildGateway('valid');
      const mockServer = buildMockServer();
      gateway.server = mockServer as unknown as Server;

      const payload: LocationUpdatePayload = { geometry, rideId: 'ride-42' };

      const result = await gateway.handleLocationUpdate(payload, mockUser);

      expect(mockServer.to).toHaveBeenCalledWith('ride:ride-42');
      expect(mockServer.emit).toHaveBeenCalledWith(WsEvent.LOCATION_UPDATED, {
        userId: mockUser.sub,
        rideId: 'ride-42',
        geometry,
        properties: undefined,
      });
      expect(result).toEqual({ status: 'ok' });
    });

    it('does not broadcast when no rideId is provided', async () => {
      const { gateway } = buildGateway('valid');
      const mockServer = buildMockServer();
      gateway.server = mockServer as unknown as Server;

      const payload: LocationUpdatePayload = { geometry };

      const result = await gateway.handleLocationUpdate(payload, mockUser);

      expect(mockServer.to).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'ok' });
    });

    it('returns error status and does not broadcast when DB update fails', async () => {
      const { gateway } = buildGateway('valid', 'throw');
      const mockServer = buildMockServer();
      gateway.server = mockServer as unknown as Server;

      const result = await gateway.handleLocationUpdate(
        { geometry, rideId: 'ride-42' },
        mockUser,
      );

      expect(mockServer.to).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'error' });
    });

    it('includes properties in the broadcast payload when provided', async () => {
      const { gateway } = buildGateway('valid');
      const mockServer = buildMockServer();
      gateway.server = mockServer as unknown as Server;

      const payload: LocationUpdatePayload = {
        geometry,
        rideId: 'ride-42',
        properties: { speed: 40 },
      };

      await gateway.handleLocationUpdate(payload, mockUser);

      expect(mockServer.emit).toHaveBeenCalledWith(
        WsEvent.LOCATION_UPDATED,
        expect.objectContaining({ properties: { speed: 40 } }),
      );
    });
  });
});
