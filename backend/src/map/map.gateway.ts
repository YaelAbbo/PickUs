import type { JWTPayload } from '@/auth/types';
import type { Ride } from '@/database/entities';
import type { User } from '@/database/entities/user.entity';
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
import type { Point } from 'geojson';
import type { Server, Socket } from 'socket.io';
import type {
  LocationUpdatePayload,
  LocationUpdatedPayload,
  RoomActionResponse,
} from './map.types';

function extractTokenFromSocket(client: Socket): string | null {
  return (client.handshake.auth?.token as string | undefined) ?? null;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_BASE_URL || 'http://localhost',
    credentials: true,
  },
})
export class MapGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MapGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private configService: ConfigService,
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
      this.logger.log(`Connected: socket=${client.id}, user=${user.sub}`);
    } catch (error) {
      this.logger.error(
        `Rejected invalid token from socket: ${client.id}`,
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
  }

  buildRoomId(rideId: Ride['id']): string {
    return `ride:${rideId}`;
  }

  @SubscribeMessage(WsEvent.ROOM_JOIN)
  @UseGuards(WsJwtGuard)
  handleRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() rideId: Ride['id'],
    @WsCurrentUser() user: JWTPayload,
  ): RoomActionResponse {
    client.join(this.buildRoomId(rideId));
    this.logger.log(`User ${user.sub} joined room ${this.buildRoomId(rideId)}`);
    return { rideId };
  }

  @SubscribeMessage(WsEvent.ROOM_LEAVE)
  @UseGuards(WsJwtGuard)
  handleRoomLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() rideId: Ride['id'],
    @WsCurrentUser() user: JWTPayload,
  ): RoomActionResponse {
    client.leave(this.buildRoomId(rideId));
    this.logger.log(`User ${user.sub} left room ${this.buildRoomId(rideId)}`);
    return { rideId };
  }

  @SubscribeMessage(WsEvent.LOCATION_UPDATE)
  @UseGuards(WsJwtGuard)
  async handleLocationUpdate(
    @MessageBody() payload: LocationUpdatePayload,
    @WsCurrentUser() user: JWTPayload,
  ): Promise<{ status: string }> {
    const { rideId, geometry, properties } = payload;

    this.logger.log(
      `Location update from user=${user.sub} rideId=${rideId ?? 'none'}`,
    );

    try {
      await this.userService.updateLocation(
        user.sub as User['id'],
        geometry as Point,
      );
    } catch (err) {
      this.logger.error(`Failed to persist location for user=${user.sub}`, err);
      return { status: 'error' };
    }

    if (rideId) {
      const outbound: LocationUpdatedPayload = {
        userId: user.sub as User['id'],
        rideId,
        geometry,
        properties,
      };
      this.server
        .to(this.buildRoomId(rideId))
        .emit(WsEvent.LOCATION_UPDATED, outbound);
    }

    return { status: 'ok' };
  }
}
