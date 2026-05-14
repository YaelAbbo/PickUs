import type { Notification, Ride } from '@/database/entities';
import { NotificationService } from '@/notification/notification.service';
import { RidePassengerService } from '@/ride-passenger/ride-passenger.service';
import { Injectable, Logger } from '@nestjs/common';
import type { Point } from 'geojson';
import type {
  DriverNearStopNotificationPayload,
  DriverNearStopPayload,
  PassengerProximityNotification,
  PassengerStopKey,
} from './ride-proximity-notification.types';
import {
  DRIVER_PROXIMITY_TO_STOP_THRESHOLD_METERS,
  createDriverNearStopMessage,
  createPassengerStopKey,
  getDriverDistanceFromStop,
} from './ride-proximity-notification.utils';

@Injectable()
export class ProximityNotificationService {
  private readonly logger = new Logger(ProximityNotificationService.name);

  private readonly notifiedPassengerStopKeyToNotificationId = new Map<
    PassengerStopKey,
    Notification['id']
  >();

  constructor(
    private readonly ridePassengerService: RidePassengerService,
    private readonly notificationService: NotificationService,
  ) {}

  checkAndCollectNotifications = async ({
    rideId,
    driverLocation,
    driverName,
  }: Pick<DriverNearStopPayload, 'rideId' | 'driverName'> & {
    driverLocation: Point;
  }) => {
    const ridePassengers =
      await this.ridePassengerService.getPassengersByRide(rideId);

    const proximityNotifications: PassengerProximityNotification[] = [];

    for (const passenger of ridePassengers) {
      const { rideStop, user } = passenger;
      const passengerId = user.id;

      const rideStopKey = createPassengerStopKey({
        passengerId,
        rideStopId: rideStop.id,
      });

      const driverDistanceFromStop = getDriverDistanceFromStop({
        driverLocation,
        stopLocation: rideStop.location,
      });

      if (driverDistanceFromStop > DRIVER_PROXIMITY_TO_STOP_THRESHOLD_METERS)
        continue;

      this.logger.log(
        `Driver is ${driverDistanceFromStop}m from stop '${rideStop.locationName}' for passenger ${user.fullName}, sending notification`,
      );

      const existingNotificationId =
        this.notifiedPassengerStopKeyToNotificationId.get(rideStopKey);

      const notificationId = await (existingNotificationId
        ? this.updateDriverNearStopNotification({
            passenger,
            driverName,
            notificationId: existingNotificationId,
            driverDistanceFromStop,
          })
        : this.createDriverNearStopNotification({
            passenger,
            driverName,
            rideId,
            driverDistanceFromStop,
          }));

      if (!notificationId) continue;

      this.notifiedPassengerStopKeyToNotificationId.set(
        rideStopKey,
        notificationId,
      );

      proximityNotifications.push({
        passengerId,
        payload: {
          rideId,
          stopId: rideStop.id,
          stopName: rideStop.locationName,
          driverName,
          driverDistanceFromStop,
          estimatedArrivalAt: rideStop.estimatedArrivalAt,
        },
      });
    }

    return proximityNotifications;
  };

  private createDriverNearStopNotification = async ({
    passenger,
    driverName,
    driverDistanceFromStop,
    rideId,
  }: DriverNearStopNotificationPayload) => {
    const driverNearStopMessage = createDriverNearStopMessage({
      driverDistanceFromStop,
      driverName,
      rideStopLocationName: passenger.rideStop.locationName,
    });

    try {
      const createdNotification = await this.notificationService.create({
        content: driverNearStopMessage,
        creatorId: passenger.userId,
        rideId,
      });

      return createdNotification.id;
    } catch (error) {
      this.logger.error(
        `Failed to create driver near stop notification for passenger ${passenger.user.fullName} (driver=${driverName}, rideStop=${passenger.rideStop.locationName})`,
        error,
      );
    }
  };

  private updateDriverNearStopNotification = async ({
    passenger,
    driverName,
    driverDistanceFromStop,
    notificationId,
  }: Omit<DriverNearStopNotificationPayload, 'rideId'> & {
    notificationId: Notification['id'];
  }) => {
    const driverNearStopMessage = createDriverNearStopMessage({
      driverDistanceFromStop,
      driverName,
      rideStopLocationName: passenger.rideStop.locationName,
    });

    try {
      await this.notificationService.update(notificationId, {
        content: driverNearStopMessage,
      });

      return notificationId;
    } catch (error) {
      this.logger.error(
        `Failed to update driver near stop notification for passenger ${passenger.user.fullName} (driver=${driverName}, rideStop=${passenger.rideStop.locationName})`,
        error,
      );
    }
  };

  /**
   * Call when a ride ends so notified keys don't grow forever.
   */
  clearRideNotifications = (rideId: Ride['id']) => {
    for (const key of this.notifiedPassengerStopKeyToNotificationId.keys()) {
      if (key.startsWith(`${rideId}:`))
        this.notifiedPassengerStopKeyToNotificationId.delete(key);
    }
  };
}
