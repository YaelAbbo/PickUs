import type { JWTPayload } from '@/auth/types';
import type { User } from '@/database/entities/user.entity';
import { UserService } from '@/user/user.service';
import { WsCurrentUser } from '@/websocket/decorators';
import { WsEvent } from '@/websocket/events';
import { WsJwtGuard } from '@/websocket/ws-jwt.guard';
import { Logger, UseGuards } from '@nestjs/common';
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
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = extractTokenFromSocket(client);

      if (!token) {
        this.logger.warn(`Rejected unauthenticated connection: ${client.id}`);
        client.disconnect();
        return;
      }

      const user = await this.jwtService.verifyAsync<JWTPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'ACCESS_TOKEN_SECRET',
      });

      client.data.user = user;
      this.logger.log(`Connected: socket=${client.id}, user=${user.sub}`);
    } catch {
      this.logger.warn(`Rejected invalid token from socket: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client.data.user as JWTPayload | undefined;
    this.logger.log(
      `Disconnected: socket=${client.id}${user ? `, user=${user.sub}` : ''}`,
    );
  }

  @SubscribeMessage(WsEvent.ROOM_JOIN)
  @UseGuards(WsJwtGuard)
  handleRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() rideId: string,
    @WsCurrentUser() user: JWTPayload,
  ): { rideId: string; status: string } {
    client.join(`ride:${rideId}`);
    this.logger.log(`User ${user.sub} joined room ride:${rideId}`);
    return { rideId, status: 'joined' };
  }

  @SubscribeMessage(WsEvent.ROOM_LEAVE)
  @UseGuards(WsJwtGuard)
  handleRoomLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() rideId: string,
    @WsCurrentUser() user: JWTPayload,
  ): { rideId: string; status: string } {
    client.leave(`ride:${rideId}`);
    this.logger.log(`User ${user.sub} left room ride:${rideId}`);
    return { rideId, status: 'left' };
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
        userId: user.sub,
        rideId,
        geometry,
        properties,
      };
      this.server.to(`ride:${rideId}`).emit(WsEvent.LOCATION_UPDATED, outbound);
    }

    return { status: 'ok' };
  }
}
