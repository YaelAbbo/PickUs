import type {
  Notification,
  Ride,
  RidePassenger,
  RideStop,
  User,
} from '@/database/entities';

export type DriverNearStopPayload = Pick<RideStop, 'estimatedArrivalAt'> &
  Pick<Notification, 'content'> & {
    rideId: Ride['id'];
    stopId: RideStop['id'];
    stopName: RideStop['locationName'];
    driver: User;
    driverDistanceFromStop: number;
  };

export type PassengerProximityNotification = {
  passengerId: User['id'];
  payload: DriverNearStopPayload;
};

export type DriverNearStopNotificationPayload = Pick<
  DriverNearStopPayload,
  'driver' | 'rideId' | 'driverDistanceFromStop'
> & { passenger: RidePassenger };

export type PassengerStopKey = `${User['id']}:${RideStop['id']}`;
