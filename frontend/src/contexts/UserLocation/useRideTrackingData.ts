import type { Ride } from '@/schemas/ride';
import { RideStatus } from '@/schemas/ride';
import { useActiveRideByPassengerId, useRidesByDriverId } from '@/services/ride/rideQueries';
import { WsEvent, useAuth, websocketService } from '@services';
import type * as Location from 'expo-location';
import { useState } from 'react';
import { useBoolean } from 'usehooks-ts';
import { buildLocationPayload } from './helpers';

export const useRideTrackingData = () => {
  const { user } = useAuth();

  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [userLocationErrorMessage, setUserLocationErrorMessage] = useState<string | null>(null);
  const { value: isUserLocationLoading, setTrue: startLoading, setFalse: stopLoading } = useBoolean();

  const { data: activeRideAsPassenger } = useActiveRideByPassengerId();
  const { data: driverRides } = useRidesByDriverId(user?.id ?? '');

  const activeRide = activeRideAsPassenger || driverRides?.find((r) => r.rideStatus === RideStatus.ACTIVE);

  const emitLocationUpdated = (coords: Location.LocationObjectCoords | GeolocationCoordinates, rideId: Ride['id']) => {
    if (!websocketService.isConnected) return;

    websocketService.emit(WsEvent.LOCATION_UPDATE, buildLocationPayload({ coords, rideId })).catch(() => {});
  };

  return {
    userLocation,
    setUserLocation,
    userLocationErrorMessage,
    setUserLocationErrorMessage,
    isUserLocationLoading,
    startLoading,
    stopLoading,
    activeRide,
    emitLocationUpdated,
  };
};
