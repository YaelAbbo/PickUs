import { Ride, RidePassenger, RideStop, type User } from '@/database/entities';
import { RideStatus } from '@/database/entities/ride.entity';
import { WsEvent } from '@/websocket/events';
import { LiveUpdatesService } from '@/websocket/live-updates.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type EntityManager } from 'typeorm';
import { JoinRideDto } from './dto/join-ride.dto';
import { UpdateRidePassengerDto } from './dto/update-ride-passenger.dto';

@Injectable()
export class RidePassengerService {
  private readonly logger = new Logger(RidePassengerService.name);

  constructor(
    @InjectRepository(RidePassenger)
    private ridePassengerRepository: Repository<RidePassenger>,
    private readonly liveUpdatesService: LiveUpdatesService,
  ) {}

  private getRideById = (manager: EntityManager, rideId: Ride['id']) =>
    manager.getRepository(Ride).findOne({
      where: { id: rideId, isDeleted: false },
      relations: ['organization'],
    });

  async joinRide(
    rideId: Ride['id'],
    userId: User['id'],
    { rideStopId }: JoinRideDto,
  ): Promise<void> {
    await this.ridePassengerRepository.manager.transaction(async (manager) => {
      const lockedRide = await this.validateLockedRide(rideId, userId, manager);

      const rideStops = await manager.find(RideStop, {
        where: { rideId, isDeleted: false },
      });

      const rideStop = this.validateRideStop(rideStopId, rideStops, rideId);

      this.validateNotLastStop(rideStop, rideStops);

      const existingPassenger = await manager.findOne(RidePassenger, {
        where: { userId, rideId },
      });

      if (existingPassenger && !existingPassenger.isDeleted)
        throw new ConflictException(
          `User ${userId} has already joined ride ${rideId}`,
        );

      const passengerCount = await manager.count(RidePassenger, {
        where: { rideId, isDeleted: false },
      });

      if (passengerCount >= lockedRide.maxSeatsAmount)
        throw new BadRequestException('Ride is full');

      try {
        if (existingPassenger) {
          await manager.update(RidePassenger, existingPassenger.id, {
            isDeleted: false,
            rideStopId,
          });
        } else {
          const passenger = manager.create(RidePassenger, {
            userId,
            rideId,
            rideStopId,
          });
          await manager.save(RidePassenger, passenger);
        }

        const ride = await this.getRideById(manager, rideId);

        if (ride?.organization?.id)
          this.liveUpdatesService.broadcastPassengerChange({
            event: WsEvent.RIDE_PASSENGER_JOINED,
            rideId,
            organizationId: ride.organization.id,
            passengerId: userId,
          });
      } catch (error) {
        this.logger.error(
          `Error occurred while user ${userId} attempted to join ride ${rideId}, ${error}`,
        );
        throw new BadRequestException(
          `User ${userId} could not join ride ${rideId}`,
        );
      }
    });
  }

  async updateRideStop(
    rideId: Ride['id'],
    userId: User['id'],
    currentUserId: User['id'],
    { rideStopId }: UpdateRidePassengerDto,
  ): Promise<void> {
    if (userId !== currentUserId) {
      throw new ForbiddenException(
        'You can only update your own ride passenger record',
      );
    }

    await this.ridePassengerRepository.manager.transaction(async (manager) => {
      await this.validateLockedRide(rideId, userId, manager);

      const passenger = await manager.findOne(RidePassenger, {
        where: { userId, rideId, isDeleted: false },
      });

      if (!passenger) {
        throw new NotFoundException(
          `Ride passenger with ID ${userId} not found on ride with ID ${rideId}`,
        );
      }

      const rideStopsForUpdate = await manager.find(RideStop, {
        where: { rideId, isDeleted: false },
      });

      const rideStop = this.validateRideStop(
        rideStopId,
        rideStopsForUpdate,
        rideId,
      );

      this.validateNotLastStop(rideStop, rideStopsForUpdate);

      passenger.rideStop = rideStop;

      try {
        await manager.save(RidePassenger, passenger);

        const ride = await this.getRideById(manager, rideId);

        if (ride?.organization?.id)
          this.liveUpdatesService.broadcastPassengerChange({
            event: WsEvent.RIDE_PASSENGER_UPDATED,
            rideId,
            organizationId: ride.organization.id,
            passengerId: userId,
          });
      } catch (error) {
        this.logger.error(
          `Error occurred while user ${currentUserId} attempted to update ride stop for ride ${rideId}, ${error}`,
        );
        throw new BadRequestException(
          `User ${currentUserId} could not update ride stop for ride ${rideId}`,
        );
      }
    });
  }

  async leaveRide(
    rideId: Ride['id'],
    userId: User['id'],
    currentUserId: User['id'],
  ): Promise<void> {
    if (userId !== currentUserId)
      throw new ForbiddenException(
        'You can only remove your own ride passenger record',
      );

    const ride = await this.getRideById(
      this.ridePassengerRepository.manager,
      rideId,
    );

    if (!ride) throw new NotFoundException(`Ride with ID ${rideId} not found`);
    if (ride.rideStatus !== RideStatus.PENDING)
      throw new ForbiddenException(
        `User ${userId} can only leave rides that are in PENDING status, ride status ${ride.rideStatus}`,
      );

    const passenger = await this.ridePassengerRepository.findOne({
      where: { userId, rideId, isDeleted: false },
    });

    if (!passenger)
      throw new NotFoundException(`Ride passenger with ID ${userId} not found`);

    try {
      await this.ridePassengerRepository.update(passenger.id, {
        isDeleted: true,
      });

      if (ride.organization?.id) {
        this.liveUpdatesService.broadcastPassengerChange({
          event: WsEvent.RIDE_PASSENGER_LEFT,
          rideId,
          organizationId: ride.organization.id,
          passengerId: userId,
        });
      }
    } catch (error) {
      this.logger.error(
        `Error occurred while user ${currentUserId} attempted to leave ride ${rideId}, ${error}`,
      );
      throw new BadRequestException(
        `User ${currentUserId} could not leave ride ${rideId}`,
      );
    }
  }

  private validateRideStop(
    rideStopId: RideStop['id'],
    rideStops: RideStop[],
    rideId: Ride['id'],
  ): RideStop {
    const rideStop = rideStops.find((stop) => stop.id === rideStopId);
    if (!rideStop)
      throw new NotFoundException(
        `Ride stop with ID ${rideStopId} not found on ride with ID ${rideId}`,
      );

    return rideStop;
  }

  private async validateLockedRide(
    rideId: Ride['id'],
    userId: User['id'],
    manager: Repository<RidePassenger>['manager'],
  ): Promise<Ride> {
    const lockedRide = await manager.findOne(Ride, {
      where: { id: rideId, isDeleted: false },
      lock: { mode: 'pessimistic_write' },
    });

    if (!lockedRide)
      throw new NotFoundException(`Ride with ID ${rideId} not found`);

    if (lockedRide.rideStatus !== RideStatus.PENDING)
      throw new ForbiddenException(
        `User ${userId} can only join rides that are in PENDING status, ride status ${lockedRide.rideStatus}`,
      );

    return lockedRide;
  }

  private validateNotLastStop(rideStop: RideStop, rideStops: RideStop[]): void {
    if (!rideStops.length) return;

    const lastStop = rideStops.reduce((max, stop) =>
      stop.orderIndex > max.orderIndex ? stop : max,
    );

    if (rideStop.id === lastStop.id) {
      throw new BadRequestException('Cannot join a ride at the last stop');
    }
  }

  getPassengersByRide = async (rideId: Ride['id']) => {
    const passengersWithDeletedValues = await this.ridePassengerRepository.find(
      {
        where: { rideId, isDeleted: false },
        relations: { rideStop: true, user: true },
      },
    );

    const ridePassengers = passengersWithDeletedValues.filter(
      ({ user, rideStop }) => !user.isDeleted && !rideStop.isDeleted,
    );

    return ridePassengers;
  };
}
