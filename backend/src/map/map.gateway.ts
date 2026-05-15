import { JWTPayload } from '@/auth/types';
import type { Ride } from '@/database/entities';
import type { User } from '@/database/entities/user.entity';
import { ProximityNotificationService } from '@/ride-proximity-notification/ride-proximity-notification.service';
import { RideService } from '@/ride/ride.service';
import { UserService } from '@/user/user.service';
import { WsCurrentUser } from '@/websocket/decorators';
import { WsEvent } from '@/websocket/events';
import { WsJwtGuard } from '@/websocket/ws-jwt.guard';
import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import {
  LocationUpdatePayload,
  type RideEntityLocationPayload,
  type RoomActionResponse,
} from './map.types';

function extractTokenFromSocket(client: Socket): string | null {
  return (client.handshake.auth?.token as string | undefined) ?? null;
}

const rideRoomIdPrefix = 'ride:';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_BASE_URL || 'http://localhost',
    credentials: true,
  },
})
export class MapGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MapGateway.name);
  private readonly rideCache = new Map<Ride['id'], Ride>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly rideService: RideService,
    private configService: ConfigService,
    private readonly proximityNotificationService: ProximityNotificationService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = extractTokenFromSocket(client);

      if (!token) {
        this.logger.error(`Rejected unauthenticated connection: ${client.id}`);
        client.disconnect();
        return;
      }

      const user = await this.jwtService.verifyAsync<JWTPayload>(token, {
        secret: this.configService.get<string>(
          'JWT_ACCESS_SECRET',
          'ACCESS_TOKEN_SECRET',
        ),
      });

      client.data.user = user;
      const userId = user.sub as User['id'];

      await client.join(this.buildUserRoomId(userId));

      this.logger.log(`Connected: socket=${client.id}, user=${userId}`);
    } catch (error) {
      this.logger.error(
        `Rejected invalid user from socket: ${client.id}`,
        error instanceof Error ? error.message : String(error),
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client.data.user as JWTPayload | undefined;
    this.logger.log(
      `Disconnected: socket=${client.id}${user ? `, user=${user.sub}` : ''}`,
    );

    const rideRoomIds = [...client.rooms]
      .filter((roomId) => roomId.startsWith(rideRoomIdPrefix))
      .map((roomId) => roomId.replace(rideRoomIdPrefix, '') as Ride['id']);

    rideRoomIds.forEach(this.clearRideCache);
  }

  buildRideRoomId(rideId: Ride['id']): string {
    return `${rideRoomIdPrefix}${rideId}`;
  }

  buildUserRoomId(userId: User['id']): string {
    return `user:${userId}`;
  }

  private getRoomSize = (roomId: string) => {
    const roomIdToSocketIds = this.server.sockets.adapter.rooms;
    const roomSize = roomIdToSocketIds.get(roomId)?.size ?? 0;

    return roomSize;
  };

  private getRideRoomSize = (rideId: Ride['id']) =>
    this.getRoomSize(this.buildRideRoomId(rideId));

  private clearRideCache = (rideId: Ride['id']) => {
    if (!this.getRideRoomSize(rideId)) this.rideCache.delete(rideId);
  };

  @SubscribeMessage(WsEvent.ROOM_JOIN)
  @UseGuards(WsJwtGuard)
  async handleRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() rideId: Ride['id'],
    @WsCurrentUser() user: JWTPayload,
  ): Promise<RoomActionResponse> {
    client.join(this.buildRideRoomId(rideId));
    this.logger.log(
      `User ${user.sub} joined room ${this.buildRideRoomId(rideId)}`,
    );

    if (!this.rideCache.has(rideId)) {
      const ride = await this.rideService.getRideById(rideId);

      this.rideCache.set(rideId, ride);
    }

    return { rideId };
  }

  @SubscribeMessage(WsEvent.ROOM_LEAVE)
  @UseGuards(WsJwtGuard)
  handleRoomLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() rideId: Ride['id'],
    @WsCurrentUser() user: JWTPayload,
  ): RoomActionResponse {
    client.leave(this.buildRideRoomId(rideId));
    this.logger.log(
      `User ${user.sub} left room ${this.buildRideRoomId(rideId)}`,
    );

    this.clearRideCache(rideId);

    return { rideId };
  }

  @SubscribeMessage(WsEvent.LOCATION_UPDATE)
  @UseGuards(WsJwtGuard)
  async handleLocationUpdate(
    @MessageBody() payload: LocationUpdatePayload,
    @WsCurrentUser() jwtPayload: JWTPayload,
  ): Promise<{ status: string }> {
    const { rideId, location } = payload;
    const userId = jwtPayload.sub as User['id'];

    this.logger.log(
      `Location update from user=${userId} rideId=${rideId ?? 'none'}`,
    );

    try {
      await this.userService.updateLocation(userId, location);
    } catch (err) {
      this.logger.error(`Failed to persist location for user=${userId}`, err);
      return { status: 'error' };
    }

    await this.handleLocationUpdateOfRide({ ...payload, userId });

    return { status: 'ok' };
  }

  private emitLocationUpdatedToRideRoom = async ({
    userId,
    rideId,
    location,
    properties,
  }: Pick<RideEntityLocationPayload, 'location' | 'properties'> & {
    userId: User['id'];
    rideId: Ride['id'];
  }) => {
    try {
      const rideLocationPayload = {
        id: userId,
        rideId,
        location,
        properties,
      } satisfies RideEntityLocationPayload;

      this.server
        .to(this.buildRideRoomId(rideId))
        .emit(WsEvent.LOCATION_UPDATED, rideLocationPayload);
    } catch (error) {
      this.logger.error(
        `Error while emitting location updated to room of ride ${rideId} from user ${userId}: ${error}`,
      );
    }
  };

  private notifyNearbyPassengers = async ({
    ride,
    driverLocation,
  }: {
    driverLocation: NonNullable<User['currentLocation']>;
    ride: Ride;
  }) => {
    const rideId = ride.id;

    try {
      const notifications =
        await this.proximityNotificationService.checkAndCollectNotifications({
          driverLocation,
          driverName: ride.driver.fullName,
          rideId,
        });

      for (const { passengerId, payload } of notifications) {
        this.server
          .to(this.buildUserRoomId(passengerId))
          .emit(WsEvent.DRIVER_NEAR_STOP, payload);

        this.logger.log(
          `Emitted ${WsEvent.DRIVER_NEAR_STOP} to user room of passenger ${passengerId}`,
        );
      }
    } catch (error) {
      this.logger.error(`Proximity check failed for ride ${rideId}`, error);
    }
  };

  private handleLocationUpdateOfRide = async ({
    rideId,
    userId,
    location,
    properties,
  }: LocationUpdatePayload & { userId: User['id'] }) => {
    if (!rideId) return;

    try {
      await this.emitLocationUpdatedToRideRoom({
        rideId,
        userId,
        location,
        properties,
      });

      const ride = this.rideCache.get(rideId);

      if (ride?.driverId === userId)
        await this.notifyNearbyPassengers({ driverLocation: location, ride });
    } catch (error) {
      this.logger.error(
        `Error while emitting location updated to room of ride ${rideId} from user ${userId}: ${error}`,
      );
    }
  };
}
