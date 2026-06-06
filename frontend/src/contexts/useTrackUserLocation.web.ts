import type { Ride } from '@/schemas/ride';
import type { LocationUpdatePayload } from '@/services/ride/rideService';
import { WsEvent, websocketService } from '@services';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

const buildLocationPayload = ({
  coords,
  rideId,
}: Pick<LocationUpdatePayload, 'rideId'> & { coords: GeolocationCoordinates }): LocationUpdatePayload => ({
  location: { type: 'Point', coordinates: [coords.longitude, coords.latitude] },
  rideId,
});

// Convert browser GeolocationPosition to expo-location LocationObject shape
const convertPositionToLocationObject = ({
  coords: { latitude, longitude, altitude, accuracy, altitudeAccuracy, heading, speed },
  timestamp,
}: GeolocationPosition): Location.LocationObject => ({
  coords: { latitude, longitude, altitude, accuracy, altitudeAccuracy, heading, speed },
  timestamp,
});

export type UseTrackUserLocationContent = ReturnType<typeof useTrackUserLocation>;

export const useTrackUserLocation = () => {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [userLocationErrorMessage, setUserLocationErrorMessage] = useState<string | null>(null);
  const [isUserLocationLoading, setIsUserLocationLoading] = useState(true);

  const watchIdRef = useRef<number | null>(null);
  const currentLiveRideIdRef = useRef<Ride['id']>(undefined);

  const joinRideTracking = (rideId: Ride['id']) => {
    currentLiveRideIdRef.current = rideId;
  };

  const leaveRideTracking = () => {
    currentLiveRideIdRef.current = undefined;
  };

  const emitLocationUpdated = useCallback((coords: GeolocationCoordinates) => {
    if (!websocketService.isConnected) return;

    const rideId = currentLiveRideIdRef.current;

    if (!rideId) return;

    websocketService.emit(WsEvent.LOCATION_UPDATE, buildLocationPayload({ coords, rideId }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocationErrorMessage('Geolocation is not supported by your browser');
      setIsUserLocationLoading(false);

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = convertPositionToLocationObject(position);

        setUserLocation(location);
        setIsUserLocationLoading(false);
        emitLocationUpdated(position.coords);
      },
      () => {
        setUserLocationErrorMessage('Location permission denied');

        setIsUserLocationLoading(false);
      },
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = convertPositionToLocationObject(position);

        setUserLocation(location);
        emitLocationUpdated(position.coords);
      },
      () => setUserLocationErrorMessage('Location update error'),
    );

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [emitLocationUpdated]);

  return { userLocation, isUserLocationLoading, userLocationErrorMessage, joinRideTracking, leaveRideTracking };
};
