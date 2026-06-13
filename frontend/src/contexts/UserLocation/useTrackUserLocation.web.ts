import { i18n } from '@/i18n';
import type { Ride } from '@/schemas/ride';
import type * as Location from 'expo-location';
import { useCallback, useEffect, useRef } from 'react';
import { useRideTrackingData } from './useRideTrackingData';

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
  const watchIdRef = useRef<number | null>(null);

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
    (rideId: Ride['id']) => {
      startLoading();

      if (!navigator.geolocation) {
        setUserLocationErrorMessage(i18n.location.location_permission_denied);
        stopLoading();

        return window.alert(
          `${i18n.location.location_permission_denied_alert_title}\n\n${i18n.location.location_permission_denied_alert_subtitle}`,
        );
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = convertPositionToLocationObject(position);

          setUserLocation(location);
          stopLoading();

          emitLocationUpdated(position.coords, rideId);
        },
        (error) => {
          console.error(error);

          setUserLocationErrorMessage(i18n.location.location_permission_denied);
          stopLoading();

          window.alert(
            `${i18n.location.location_permission_denied_alert_title}\n\n${i18n.location.location_permission_denied_alert_subtitle}`,
          );
        },
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 },
      );

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const location = convertPositionToLocationObject(position);

          setUserLocation(location);

          emitLocationUpdated(position.coords, rideId);
        },
        (error) => {
          console.error(error);

          setUserLocationErrorMessage(i18n.location.location_update_error_message);
        },
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 },
      );
    },
    [emitLocationUpdated, startLoading, stopLoading, setUserLocation, setUserLocationErrorMessage],
  );

  useEffect(() => {
    if (!activeRide?.id) return;

    startTracking(activeRide.id);

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [activeRide?.id, startTracking]);

  return { userLocation, isUserLocationLoading, userLocationErrorMessage, activeRide };
};
