import type { Ride, RidePassenger, RideStop, User } from '@/database/entities';

export type DriverNearStopPayload = Pick<RideStop, 'estimatedArrivalAt'> & {
  rideId: Ride['id'];
  stopId: RideStop['id'];
  stopName: RideStop['locationName'];
  driverName: Ride['driver']['fullName'];
  driverDistanceFromStop: number;
};

export type PassengerProximityNotification = {
  passengerId: User['id'];
  payload: DriverNearStopPayload;
};

export type DriverNearStopNotificationPayload = Pick<
  DriverNearStopPayload,
  'driverName' | 'rideId' | 'driverDistanceFromStop'
> & { passenger: RidePassenger };

export type PassengerStopKey = `${User['id']}:${RideStop['id']}`;
