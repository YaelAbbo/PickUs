import type { RideStop, User } from '@/database/entities';
import { getDistance } from 'geolib';
import type { DriverNearStopNotificationPayload } from './ride-proximity-notification.types';

export const DRIVER_PROXIMITY_TO_STOP_THRESHOLD_METERS = 500;

export const getDriverDistanceFromStop = ({
  driverLocation,
  stopLocation,
}: {
  driverLocation: NonNullable<User['currentLocation']>;
  stopLocation: RideStop['location'];
}) => {
  const [driverLongitude, driverLatitude] = driverLocation.coordinates;
  const [stopLongitude, stopLatitude] = stopLocation.coordinates;

  if (!driverLongitude || !driverLatitude || !stopLongitude || !stopLatitude)
    return 0;

  const distanceMeters = Math.round(
    getDistance(
      { longitude: driverLongitude, latitude: driverLatitude },
      { longitude: stopLongitude, latitude: stopLatitude },
    ),
  );

  return distanceMeters;
};

export const createPassengerStopKey = ({
  passengerId,
  rideStopId,
}: {
  passengerId: User['id'];
  rideStopId: RideStop['id'];
}) => `${passengerId}:${rideStopId}` as const;

export const createDriverNearStopMessage = ({
  driverName,
  driverDistanceFromStop,
  rideStopLocationName,
}: Pick<
  DriverNearStopNotificationPayload,
  'driverName' | 'driverDistanceFromStop'
> & { rideStopLocationName: RideStop['locationName'] }) =>
  `${driverName} במרחק ${driverDistanceFromStop} מ' מתחנת העצירה שלך '${rideStopLocationName}'` as const;
