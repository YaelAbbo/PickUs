import type { Ride } from '@/database/entities';
import type { User } from '@/database/entities/user.entity';
import { MapGateway } from '@/map/map.gateway';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { WsEvent } from './events';

@Injectable()
export class LiveUpdatesService {
  constructor(
    @Inject(forwardRef(() => MapGateway))
    private readonly mapGateway: MapGateway,
  ) {}

  broadcastRideChange = ({
    event,
    ride,
    organizationId,
  }: {
    event: WsEvent.RIDE_CREATED | WsEvent.RIDE_UPDATED | WsEvent.RIDE_DELETED;
    ride: Pick<Ride, 'id' | 'orgId'>;
    organizationId: Ride['orgId'];
  }) =>
    this.mapGateway.emitEventToRoom({
      roomId: this.mapGateway.buildOrganizationRoomId(organizationId),
      event,
      payload: { ride },
    });

  broadcastPassengerChange = ({
    event,
    rideId,
    organizationId,
    passenger,
  }: {
    event:
      | WsEvent.RIDE_PASSENGER_JOINED
      | WsEvent.RIDE_PASSENGER_UPDATED
      | WsEvent.RIDE_PASSENGER_LEFT;
    rideId: Ride['id'];
    organizationId: Ride['orgId'];
    passenger: Pick<User, 'id'>;
  }) =>
    this.mapGateway.emitEventToRoom({
      roomId: this.mapGateway.buildOrganizationRoomId(organizationId),
      event,
      payload: { rideId, passenger },
    });

  broadcastUserUpdate = ({ user }: { user: Pick<User, 'id' | 'orgId'> }) =>
    this.mapGateway.emitEventToRoom({
      roomId: this.mapGateway.buildOrganizationRoomId(user.orgId),
      event: WsEvent.USER_UPDATED,
      payload: { user },
    });

  broadcastRideStartedNotification = ({
    passengerIds,
    payload,
  }: {
    passengerIds: User['id'][];
    payload: { content: string; driver: Ride['driver']; rideId: Ride['id'] };
  }) =>
    passengerIds.forEach((passengerId) =>
      this.mapGateway.emitEventToRoom({
        roomId: this.mapGateway.buildUserRoomId(passengerId),
        event: WsEvent.RIDE_STARTED,
        payload,
      }),
    );
}
