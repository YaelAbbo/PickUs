import type { Ride } from '@/schemas/ride';
import { useRideLocations } from '@/services/ride/rideQueries';
import type { NonNullableRideEntityLocationPayload, RideEntityLocationPayload } from '@/services/ride/rideService';
import type { User } from '@schemas';
import { WsEvent, useAuth, websocketService } from '@services';
import { useFocusEffect } from 'expo-router';
import { append } from 'rambda';
import { useEffect, useState } from 'react';

const isRideEntityHasLocation =
  (currentUserId: User['id'] | undefined) =>
  (rideEntity: RideEntityLocationPayload): rideEntity is NonNullableRideEntityLocationPayload =>
    !!rideEntity.location && rideEntity.id !== currentUserId;

export type UseRideLocationsLogicArgs = { rideId: Ride['id'] };

export type UseRideLocationsLogicContent = ReturnType<typeof useRideLocations>;

export const useRideLocationsLogic = ({ rideId }: UseRideLocationsLogicArgs) => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const { data: initialRideLocationsPayloads = [] } = useRideLocations(rideId);

  const [currentRideLocations, setCurrentRideLocations] = useState<NonNullableRideEntityLocationPayload[]>([]);

  useEffect(() => {
    const locationsPayloads = initialRideLocationsPayloads.filter(isRideEntityHasLocation(currentUserId));

    setCurrentRideLocations(locationsPayloads);
  }, [currentUserId, initialRideLocationsPayloads]);

  useFocusEffect(() => {
    websocketService.emit(WsEvent.ROOM_JOIN, rideId);

    const unsubscribeFromLocationUpdated = websocketService.on(
      WsEvent.LOCATION_UPDATED,
      (locationPayload: RideEntityLocationPayload) => {
        const isLocationPayloadValid = isRideEntityHasLocation(currentUserId)(locationPayload);

        if (isLocationPayloadValid) setCurrentRideLocations(append(locationPayload));
      },
    );

    return () => {
      websocketService.emit(WsEvent.ROOM_LEAVE, rideId);

      unsubscribeFromLocationUpdated();
    };
  });

  return { currentRideLocations };
};
