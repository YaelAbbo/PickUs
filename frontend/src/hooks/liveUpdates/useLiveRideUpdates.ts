import type { Organization } from '@/api/organization';
import type { Ride, RideDto } from '@/schemas/ride';
import { useAuth } from '@/services/auth/AuthContext';
import { RIDES_QUERY_KEYS } from '@/services/ride/rideQueries';
import type { User } from '@schemas';
import { WsEvent, websocketService } from '@services';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

type LiveRideUpdatePayload = { ride: Pick<RideDto, 'id' | 'orgId'> };
type LiveRidePassengerUpdatePayload = { rideId: RideDto['id']; passengerId: User['id']; orgId: Organization['id'] };

export const useLiveRideUpdates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidateAllRideQueries = useCallback(
    ({ rideId, orgId }: { rideId: Ride['id']; orgId: Organization['id'] }) => {
      if (orgId !== user?.organization?.id) return;

      queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.available() });
      queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.detail(rideId) });
    },
    [queryClient, user?.organization?.id],
  );

  useEffect(() => {
    const organizationId = user?.organization?.id;

    if (!organizationId) return;

    const rideUpdateWSEvents = [WsEvent.RIDE_CREATED, WsEvent.RIDE_UPDATED, WsEvent.RIDE_DELETED];

    const rideEventHandler = ({ ride }: LiveRideUpdatePayload) =>
      invalidateAllRideQueries({ rideId: ride.id, orgId: ride.orgId });

    const ridePassengerUpdateWSEvents = [
      WsEvent.RIDE_PASSENGER_JOINED,
      WsEvent.RIDE_PASSENGER_UPDATED,
      WsEvent.RIDE_PASSENGER_LEFT,
    ];

    const ridePassengerEventHandler = (liveRidePassengerUpdatePayload: LiveRidePassengerUpdatePayload) =>
      invalidateAllRideQueries(liveRidePassengerUpdatePayload);

    const unsubscribeCallbacks = [
      ...rideUpdateWSEvents.map((event) => websocketService.on(event, rideEventHandler)),
      ...ridePassengerUpdateWSEvents.map((event) => websocketService.on(event, ridePassengerEventHandler)),
    ];

    return () => unsubscribeCallbacks.forEach((callback) => callback());
  }, [invalidateAllRideQueries, queryClient, user]);
};
