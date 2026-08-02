import { Ride } from '@/database/entities';
import { MapGateway } from '@/map/map.gateway';
import { describe, expect, it, jest } from '@jest/globals';
import { WsEvent } from './events';
import { LiveUpdatesService } from './live-updates.service';

describe('LiveUpdatesService', () => {
  it('forwards ride changes through the gateway room helper', () => {
    const emitEventToRoom = jest.fn();
    const gateway = {
      emitEventToRoom,
      buildOrganizationRoomId: jest.fn(() => 'org:abc'),
    } as unknown as MapGateway;

    const service = new LiveUpdatesService(gateway);

    const ride = {
      id: 'ride-1' as unknown as Ride['id'],
      orgId: 'org-abc' as unknown as Ride['orgId'],
    } as Pick<Ride, 'id' | 'orgId'>;

    service.broadcastRideChange({
      event: WsEvent.RIDE_CREATED,
      ride,
      organizationId: 'org-abc' as Ride['orgId'],
    });

    expect(emitEventToRoom).toHaveBeenCalledWith({
      roomId: 'org:abc',
      event: WsEvent.RIDE_CREATED,
      payload: { ride },
    });
  });
});
