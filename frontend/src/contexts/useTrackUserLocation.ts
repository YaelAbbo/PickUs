import { i18n } from '@/i18n';
import { RideStatus, type Ride } from '@/schemas/ride';
import { useActiveRideByPassengerId, useRidesByDriverId } from '@/services/ride/rideQueries';
import type { LocationUpdatePayload } from '@/services/ride/rideService';
import { WsEvent, useAuth, websocketService } from '@services';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useBoolean } from 'usehooks-ts';

const buildLocationPayload = ({
  coords,
  rideId,
}: Pick<LocationUpdatePayload, 'rideId'> & { coords: Location.LocationObjectCoords }): LocationUpdatePayload => ({
  location: { type: 'Point', coordinates: [coords.longitude, coords.latitude] },
  rideId,
});

export type UseTrackUserLocationContent = ReturnType<typeof useTrackUserLocation>;

export const useTrackUserLocation = () => {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [userLocationErrorMessage, setUserLocationErrorMessage] = useState<string | null>(null);
  const { value: isUserLocationLoading, setTrue: startLoading, setFalse: stopLoading } = useBoolean();

  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const { user } = useAuth();
  const { data: activeRideAsPassenger } = useActiveRideByPassengerId();
  const { data: driverRides } = useRidesByDriverId(user?.id ?? '');

  const activeRide = activeRideAsPassenger || driverRides?.find((r) => r.rideStatus === RideStatus.ACTIVE);

  const emitLocationUpdated = useCallback((coords: Location.LocationObjectCoords, rideId: Ride['id']) => {
    if (!websocketService.isConnected) return;

    websocketService.emit(WsEvent.LOCATION_UPDATE, buildLocationPayload({ coords, rideId }));
  }, []);

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
    [emitLocationUpdated, startLoading, stopLoading],
  );

  useEffect(() => {
    if (!activeRide?.id) return;

    startTracking(activeRide.id);

    return () => locationSubscriptionRef.current?.remove();
  }, [activeRide?.id, startTracking]);

  return { userLocation, isUserLocationLoading, userLocationErrorMessage, activeRide };
};
