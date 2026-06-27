import type { Ride } from '@/schemas/ride';
import { useRideLocations } from '@/services/ride/rideQueries';
import {
  RideEntityType,
  type RideEntityLocationPayload,
  type RideEntityLocationPayloadWithDetails,
} from '@/services/ride/rideService';
import { WsEvent, useAuth, websocketService } from '@services';
import { useFocusEffect } from 'expo-router';
import { append, filter, pipe } from 'rambda';
import { useEffect, useState } from 'react';

const upsertRideLocation =
  (updatedLocationPayload: RideEntityLocationPayloadWithDetails) =>
  (prevRideLocations: RideEntityLocationPayloadWithDetails[]) =>
    pipe(
      prevRideLocations,
      filter(({ id }) => id !== updatedLocationPayload.id),
      append(updatedLocationPayload),
    );

export type UseRideLocationsLogicArgs = { ride: Ride | undefined | null };

export type UseRideLocationsLogicContent = ReturnType<typeof useRideLocations>;

export const useRideLocationsLogic = ({ ride }: UseRideLocationsLogicArgs) => {
  const { user } = useAuth();

  const currentUserId = user?.id;
  const rideId = ride?.id;

  const { data: initialRideLocationsPayloads = [], isSuccess } = useRideLocations(rideId);

  const [currentRideLocations, setCurrentRideLocations] = useState<RideEntityLocationPayloadWithDetails[]>([]);

  useEffect(() => {
    if (!isSuccess) return;

    const initialRideLocationsPayloadsWithoutCurrentUser = initialRideLocationsPayloads.filter(
      ({ id }) => id !== currentUserId,
    );

    setCurrentRideLocations(initialRideLocationsPayloadsWithoutCurrentUser);
  }, [currentUserId, initialRideLocationsPayloads, isSuccess]);

  useFocusEffect(() => {
    if (!ride || !rideId) return;

    websocketService.emit(WsEvent.ROOM_JOIN, rideId).catch(() => {});

    const unsubscribeConnection = websocketService.onConnectionChange((connected) => {
      if (connected) {
        websocketService.emit(WsEvent.ROOM_JOIN, rideId).catch(() => {});
      }
    });

    const { passengers, stops, driver, driverId } = ride;

    const unsubscribeFromLocationUpdated = websocketService.on(
      WsEvent.LOCATION_UPDATED,
      (updatedLocationPayload: RideEntityLocationPayload) => {
        if (updatedLocationPayload.id === currentUserId) return;

        const isDriver = updatedLocationPayload.id === driverId;

        const passengerFullName = passengers.find(({ userId }) => userId === updatedLocationPayload.id)?.user?.fullName;

        const rideStopLocationName = stops.find(({ id }) => id === updatedLocationPayload.id)?.locationName;

        const name = isDriver ? driver?.fullName : (passengerFullName ?? rideStopLocationName);

        if (!name) return;

        const updatedLocationPayloadWithDetails = {
          ...updatedLocationPayload,
          name,
          type: isDriver ? RideEntityType.DRIVER : RideEntityType.PASSENGER,
        } satisfies RideEntityLocationPayloadWithDetails;

        setCurrentRideLocations(upsertRideLocation(updatedLocationPayloadWithDetails));
      },
    );

    return () => {
      websocketService.emit(WsEvent.ROOM_LEAVE, rideId).catch(() => {});
      unsubscribeConnection();
      unsubscribeFromLocationUpdated();
    };
  });

  return { currentRideLocations };
};
