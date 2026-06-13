import { i18n } from '@/i18n';
import type { Ride } from '@/schemas/ride';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useRideTrackingData } from './useRideTrackingData';

export type UseTrackUserLocationContent = ReturnType<typeof useTrackUserLocation>;

export const useTrackUserLocation = () => {
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const {
    userLocation,
    setUserLocation,
    userLocationErrorMessage,
    setUserLocationErrorMessage,
    isUserLocationLoading,
    startLoading,
    stopLoading,
    activeRide,
    emitLocationUpdated,
  } = useRideTrackingData();

  const startTracking = useCallback(
    async (rideId: Ride['id']) => {
      startLoading();

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

        emitLocationUpdated(initialUserLocation.coords, rideId);

        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 60000, // In milliseconds
            distanceInterval: 50, // In meters
          },
          (newLocation) => {
            setUserLocation(newLocation);

            emitLocationUpdated(newLocation.coords, rideId);
          },
        );
      } catch (error) {
        console.error(error);

        setUserLocationErrorMessage(i18n.location.location_update_error_message);
      } finally {
        stopLoading();
      }
    },
    [emitLocationUpdated, startLoading, stopLoading, setUserLocation, setUserLocationErrorMessage],
  );

  useEffect(() => {
    if (!activeRide?.id) return;

    startTracking(activeRide.id);

    return () => locationSubscriptionRef.current?.remove();
  }, [activeRide?.id, startTracking]);

  return { userLocation, isUserLocationLoading, userLocationErrorMessage, activeRide };
};
