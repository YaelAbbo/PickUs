import type { RideDto } from '@/schemas/ride';
import { useAuth } from '@/services/auth/AuthContext';
import { RIDES_QUERY_KEYS } from '@/services/ride/rideQueries';
import { WsEvent, websocketService } from '@services';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

type LiveRideUpdatePayload = { ride: Pick<RideDto, 'id' | 'orgId'> };

export const useLiveRideUpdates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const organizationId = user?.organization?.id;

    if (!organizationId) return;

    const handler = ({ ride }: LiveRideUpdatePayload) => {
      if (ride.orgId !== organizationId) return;

      queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.available() });
      queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.detail(ride.id) });
    };

    const rideUpdateWSEvents = [
      WsEvent.RIDE_CREATED,
      WsEvent.RIDE_UPDATED,
      WsEvent.RIDE_DELETED,
      WsEvent.RIDE_PASSENGER_JOINED,
      WsEvent.RIDE_PASSENGER_UPDATED,
      WsEvent.RIDE_PASSENGER_LEFT,
    ];

    const unsubscribeCallbacks = rideUpdateWSEvents.map((event) => websocketService.on(event, handler));

    return () => unsubscribeCallbacks.forEach((callback) => callback());
  }, [queryClient, user]);
};
