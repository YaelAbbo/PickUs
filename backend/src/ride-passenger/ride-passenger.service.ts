import { Ride, RidePassenger, RideStop, type User } from '@/database/entities';
import { RideStatus } from '@/database/entities/ride.entity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JoinRideDto } from './dto/join-ride.dto';
import { UpdateRidePassengerDto } from './dto/update-ride-passenger.dto';

/* Lock the ride row for the duration of join and update functions transaction. Any 
   concurrent write on the same row will block here until the function is finished. */

@Injectable()
export class RidePassengerService {
  private readonly logger: Logger = new Logger(RidePassengerService.name);

  constructor(
    @InjectRepository(RidePassenger)
    private ridePassengerRepository: Repository<RidePassenger>,
  ) {}

  async joinRide(
    rideId: Ride['id'],
    userId: User['id'],
    { rideStopId }: JoinRideDto,
  ): Promise<void> {
    await this.ridePassengerRepository.manager.transaction(async (manager) => {
      const lockedRide = await manager.getRepository(Ride).findOne({
        where: { id: rideId, isDeleted: false },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedRide)
        throw new NotFoundException(`Ride with ID ${rideId} not found`);

      if (lockedRide.rideStatus !== RideStatus.PENDING)
        throw new ForbiddenException(
          `User ${userId} can only join rides that are in PENDING status, ride status ${lockedRide.rideStatus}`,
        );

      const rideStops = await manager
        .getRepository(RideStop)
        .find({ where: { ride: { id: rideId }, isDeleted: false } });

      const rideStop = rideStops.find((stop) => stop.id === rideStopId);
      if (!rideStop)
        throw new ForbiddenException(
          `Ride stop with ID ${rideStopId} not found on ride with ID ${rideId}`,
        );

      const existingPassenger = await manager
        .getRepository(RidePassenger)
        .findOne({ where: { user: { id: userId }, ride: { id: rideId } } });

      if (existingPassenger)
        throw new ConflictException(
          `User ${userId} has already joined ride ${rideId}`,
        );

      const passengerCount = await manager
        .getRepository(RidePassenger)
        .count({ where: { ride: { id: rideId }, isDeleted: false } });

      if (passengerCount >= lockedRide.maxSeatsAmount)
        throw new BadRequestException('Ride is full');

      try {
        const passenger = manager.getRepository(RidePassenger).create({
          user: { id: userId },
          ride: { id: rideId },
          rideStop: { id: rideStopId },
        });
        await manager.getRepository(RidePassenger).save(passenger);
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
      const lockedRide = await manager.getRepository(Ride).findOne({
        where: { id: rideId, isDeleted: false },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedRide) {
        throw new NotFoundException(`Ride with ID ${rideId} not found`);
      }

      if (lockedRide.rideStatus !== RideStatus.PENDING) {
        throw new ForbiddenException(
          `Can only update stop on rides that are in PENDING status, ride status ${lockedRide.rideStatus}`,
        );
      }

      const passenger = await manager.getRepository(RidePassenger).findOne({
        where: {
          user: { id: userId },
          ride: { id: rideId },
          isDeleted: false,
        },
        relations: ['user'],
      });

      if (!passenger) {
        throw new NotFoundException(
          `Ride passenger with ID ${userId} not found on ride with ID ${rideId}`,
        );
      }

      const rideStopsForUpdate = await manager
        .getRepository(RideStop)
        .find({ where: { ride: { id: rideId }, isDeleted: false } });
      const rideStop = rideStopsForUpdate.find(
        (stop) => stop.id === rideStopId,
      );
      if (!rideStop) {
        throw new ForbiddenException(
          `Ride stop with ID ${rideStopId} not found on ride with ID ${rideId}`,
        );
      }

      passenger.rideStop = rideStop;

      try {
        await manager.getRepository(RidePassenger).save(passenger);
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

    const ride = await this.ridePassengerRepository.manager
      .getRepository(Ride)
      .findOne({ where: { id: rideId, isDeleted: false } });

    if (!ride) throw new NotFoundException(`Ride with ID ${rideId} not found`);
    if (ride.rideStatus !== RideStatus.PENDING)
      throw new ForbiddenException(
        `User ${userId} can only leave rides that are in PENDING status, ride status ${ride.rideStatus}`,
      );

    const passenger = await this.ridePassengerRepository.findOne({
      where: { user: { id: userId }, ride: { id: rideId }, isDeleted: false },
    });

    if (!passenger)
      throw new NotFoundException(`Ride passenger with ID ${userId} not found`);

    try {
      await this.ridePassengerRepository.update(passenger.id, {
        isDeleted: true,
      });
    } catch (error) {
      this.logger.error(
        `Error occurred while user ${currentUserId} attempted to leave ride ${rideId}, ${error}`,
      );
      throw new BadRequestException(
        `User ${currentUserId} could not leave ride ${rideId}`,
      );
    }
  }
}
