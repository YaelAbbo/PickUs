import { JWTPayload } from '@/auth/types';
import { Ride } from '@/database/entities';
import type { User } from '@/database/entities/user.entity';
import { NotificationService } from '@/notification/notification.service';
import { ProximityNotificationService } from '@/ride-proximity-notification/ride-proximity-notification.service';
import { UserService } from '@/user/user.service';
import { WsCurrentUser } from '@/websocket/decorators';
import { WsEvent } from '@/websocket/events';
import { WsJwtGuard } from '@/websocket/ws-jwt.guard';
import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
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
import { Repository } from 'typeorm';
import {
  LocationUpdatePayload,
  type RideEntityLocationPayload,
  type RoomActionResponse,
} from './map.types';

function extractTokenFromSocket(client: Socket): string | null {
  return (client.handshake.auth?.token as string | undefined) ?? null;
}

const rideRoomIdPrefix = 'ride:';

type CachedRide = Pick<Ride, 'id' | 'driver'>;

@WebSocketGateway({
  path: '/api/socket.io',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class MapGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MapGateway.name);
  private readonly rideCache = new Map<Ride['id'], CachedRide>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @InjectRepository(Ride)
    private readonly ridesRepository: Repository<Ride>,
    private configService: ConfigService,
    private readonly proximityNotificationService: ProximityNotificationService,
    private readonly notificationService: NotificationService,
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
      const connectedUser = await this.userService.getUserById(userId);

      await client.join(this.buildUserRoomId(userId));

      if (connectedUser.organization?.id)
        await client.join(
          this.buildOrganizationRoomId(connectedUser.organization.id),
        );

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

    const rideIds = [...client.rooms]
      .filter((roomId) => roomId.startsWith(rideRoomIdPrefix))
      .map((roomId) => roomId.replace(rideRoomIdPrefix, '') as Ride['id']);

    rideIds.forEach(this.clearRideCache);
  }

  buildRideRoomId(rideId: Ride['id']): string {
    return `${rideRoomIdPrefix}${rideId}`;
  }

  buildUserRoomId(userId: User['id']): string {
    return `user:${userId}`;
  }

  buildOrganizationRoomId(organizationId: string): string {
    return `org:${organizationId}`;
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

  private getRideFromCacheOrDb = async (
    rideId: Ride['id'],
  ): Promise<CachedRide | undefined> => {
    let ride = this.rideCache.get(rideId);

    if (!ride) {
      const dbRide = await this.ridesRepository.findOne({
        where: { id: rideId },
        relations: ['driver'],
        select: { id: true, driver: true },
      });

      if (dbRide) {
        ride = dbRide as CachedRide;
        this.rideCache.set(rideId, ride);
      }
    }

    return ride;
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

    await this.getRideFromCacheOrDb(rideId);

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

    this.logger.log(`Location update from user=${userId} rideId=${rideId}`);

    try {
      await this.userService.updateLocation(userId, location);
    } catch (err) {
      this.logger.error(`Failed to update location for user=${userId}`, err);
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

      this.emitEventToRoom({
        roomId: this.buildRideRoomId(rideId),
        event: WsEvent.LOCATION_UPDATED,
        payload: rideLocationPayload,
      });
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
    ride: CachedRide;
  }) => {
    const rideId = ride.id;

    try {
      const notifications =
        await this.proximityNotificationService.upsertNotifications({
          driverLocation,
          driver: ride.driver,
          rideId,
        });

      for (const { passengerId, payload } of notifications)
        this.emitEventToRoom({
          roomId: this.buildUserRoomId(passengerId),
          event: WsEvent.DRIVER_NEAR_STOP,
          payload,
        });
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
    try {
      await this.emitLocationUpdatedToRideRoom({
        rideId,
        userId,
        location,
        properties,
      });

      const ride = await this.getRideFromCacheOrDb(rideId);

      if (ride?.driver.id === userId)
        await this.notifyNearbyPassengers({ driverLocation: location, ride });
    } catch (error) {
      this.logger.error(
        `Error while emitting location updated to room of ride ${rideId} from user ${userId}: ${error}`,
      );
    }
  };

  emitEventToRoom = ({
    roomId,
    event,
    payload,
  }: {
    roomId: string;
    event: WsEvent;
    payload: unknown;
  }) => {
    this.server.to(roomId).emit(event, payload);

    this.logger.log(`Emitted ${event} to room ${roomId}`);
  };

  sendRideStartedNotification = (
    passengerIds: User['id'][],
    payload: { content: string; driver: User; rideId: Ride['id'] },
  ) => {
    for (const passengerId of passengerIds) {
      this.emitEventToRoom({
        roomId: this.buildUserRoomId(passengerId),
        event: WsEvent.RIDE_STARTED,
        payload,
      });
    }
  };

  @SubscribeMessage(WsEvent.DRIVER_MESSAGE)
  @UseGuards(WsJwtGuard)
  async handleDriverMessage(
    @MessageBody()
    payload: { passengerId: User['id']; rideId?: Ride['id']; content: string },
    @WsCurrentUser() jwtPayload: JWTPayload,
  ): Promise<{ status: string }> {
    const driverId = jwtPayload.sub as User['id'];
    const { passengerId, rideId, content } = payload;

    try {
      await this.notificationService.create({
        creatorId: driverId,
        recipientId: passengerId,
        rideId,
        content,
      });

      const driver = await this.userService.getUserById(driverId);

      this.server
        .to(this.buildUserRoomId(passengerId))
        .emit(WsEvent.DRIVER_MESSAGE, {
          content,
          driver,
          rideId,
        });

      this.logger.log(
        `Driver ${driverId} sent message notification to passenger ${passengerId}`,
      );
      return { status: 'ok' };
    } catch (error) {
      this.logger.error(
        `Failed to send driver message from ${driverId} to ${passengerId}`,
        error,
      );
      return { status: 'error' };
    }
  }
}
