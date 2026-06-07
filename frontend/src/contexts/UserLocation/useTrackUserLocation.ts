import { i18n } from '@/i18n';
import type { Ride } from '@/schemas/ride';
import { WsEvent, websocketService } from '@services';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useBoolean } from 'usehooks-ts';
import { buildLocationPayload } from './helpers';

export type UseTrackUserLocationContent = ReturnType<typeof useTrackUserLocation>;

export const useTrackUserLocation = () => {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [userLocationErrorMessage, setUserLocationErrorMessage] = useState<string | null>(null);
  const { value: isUserLocationLoading, setFalse: stopLoading } = useBoolean(true);

  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const currentLiveRideIdRef = useRef<Ride['id']>(undefined);

  const joinRideTracking = (rideId: Ride['id']) => {
    currentLiveRideIdRef.current = rideId;
  };

  const leaveRideTracking = () => {
    currentLiveRideIdRef.current = undefined;
  };

  const emitLocationUpdated = useCallback((coords: Location.LocationObjectCoords) => {
    if (!websocketService.isConnected) return;

    const rideId = currentLiveRideIdRef.current;

    if (!rideId) return;

    websocketService.emit(WsEvent.LOCATION_UPDATE, buildLocationPayload({ coords, rideId }));
  }, []);

  const startTracking = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      setUserLocationErrorMessage(i18n.location.location_permission_denied);
      stopLoading();

      return Alert.alert(
        i18n.location.location_permission_denied_alert_title,
        i18n.location.location_permission_denied_alert_subtitle,
      );
    }

    try {
      const initialUserLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      setUserLocation(initialUserLocation);
      stopLoading();

      emitLocationUpdated(initialUserLocation.coords);

      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 60000, // In milliseconds
          distanceInterval: 50, // In meters
        },
        (newLocation) => {
          setUserLocation(newLocation);

          emitLocationUpdated(newLocation.coords);
        },
      );
    } catch (error) {
      console.error(error);

      setUserLocationErrorMessage(i18n.location.location_update_error_message);
    } finally {
      stopLoading();
    }
  }, [emitLocationUpdated, stopLoading]);

  useEffect(() => {
    startTracking();

    return () => locationSubscriptionRef.current?.remove();
  }, [startTracking]);

  return { userLocation, isUserLocationLoading, userLocationErrorMessage, joinRideTracking, leaveRideTracking };
};
