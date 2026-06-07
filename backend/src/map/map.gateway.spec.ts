import type { ProximityNotificationService } from '@/ride-proximity-notification/ride-proximity-notification.service';
import type { RideService } from '@/ride/ride.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Point } from 'geojson';
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

function buildMockServer(): {
  to: jest.Mock;
  emit: jest.Mock;
  sockets: { adapter: { rooms: Map<string, Set<string>> } };
} {
  const emit = jest.fn();
  const to = jest.fn().mockReturnValue({ emit });
  return {
    to,
    emit,
    sockets: { adapter: { rooms: new Map() } },
  };
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

  const rideService = {
    getRideById: jest.fn().mockImplementation(() => {
      if (updateLocationResult === 'throw')
        return Promise.reject(new Error('db error'));
      return Promise.resolve();
    }),
  } as unknown as RideService;

  const configService = {
    get: jest
      .fn()
      .mockImplementation((key: string, defaultValue: string) => defaultValue),
  } as unknown as ConfigService;

  const proximityNotificationService = {
    checkAndNotify: jest.fn().mockResolvedValue(undefined),
  } as unknown as ProximityNotificationService;

  const gateway = new MapGateway(
    jwtService,
    userService,
    rideService,
    configService,
    proximityNotificationService,
  );
  return {
    gateway,
    jwtService,
    userService,
    rideService,
    configService,
    proximityNotificationService,
  };
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
    it('joins the correct ride room and returns an ack', async () => {
      const { gateway } = buildGateway('valid');
      const client = buildMockSocket();
      client.data.user = mockUser;
      const rideId = '550e8400-e29b-41d4-a716-446655440000' as const;

      const result = await gateway.handleRoomJoin(client, rideId, mockUser);

      expect(client.join).toHaveBeenCalledWith(`ride:${rideId}`);
      expect(result).toEqual({ rideId });
    });
  });

  describe('handleRoomLeave', () => {
    it('leaves the correct ride room and returns an ack', () => {
      const { gateway } = buildGateway('valid');
      const mockServer = buildMockServer();
      gateway.server = mockServer as unknown as Server;
      const client = buildMockSocket();
      client.data.user = mockUser;
      const rideId = '550e8400-e29b-41d4-a716-446655440000' as const;

      const result = gateway.handleRoomLeave(client, rideId, mockUser);

      expect(client.leave).toHaveBeenCalledWith(`ride:${rideId}`);
      expect(result).toEqual({ rideId });
    });
  });

  describe('handleLocationUpdate', () => {
    const location: Point = { type: 'Point', coordinates: [34.8516, 31.0461] };
    const rideId = '550e8400-e29b-41d4-a716-446655440000' as const;

    it('persists the location to the user record', async () => {
      const { gateway, userService } = buildGateway('valid');
      const mockServer = buildMockServer();
      gateway.server = mockServer as unknown as Server;

      await gateway.handleLocationUpdate({ location, rideId }, mockUser);

      expect(userService.updateLocation).toHaveBeenCalledWith(
        mockUser.sub,
        location,
      );
    });

    it('broadcasts location:updated to the ride room when rideId is provided', async () => {
      const { gateway } = buildGateway('valid');
      const mockServer = buildMockServer();
      gateway.server = mockServer as unknown as Server;

      const payload: LocationUpdatePayload = { location, rideId };

      const result = await gateway.handleLocationUpdate(payload, mockUser);

      expect(mockServer.to).toHaveBeenCalledWith(`ride:${rideId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(WsEvent.LOCATION_UPDATED, {
        id: mockUser.sub,
        rideId,
        location,
        properties: undefined,
      });
      expect(result).toEqual({ status: 'ok' });
    });

    it('returns error status and does not broadcast when DB update fails', async () => {
      const { gateway } = buildGateway('valid', 'throw');
      const mockServer = buildMockServer();
      gateway.server = mockServer as unknown as Server;

      const result = await gateway.handleLocationUpdate(
        { location, rideId },
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
        location,
        rideId,
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
