import {
  Ride,
  RideStatus,
  type Organization,
  type User,
} from '@/database/entities';
import type { RideEntityLocationPayloadWithFullDetails } from '@/map/map.types';
import { CreateNotificationDto } from '@/notification/dto/create-notification.dto';
import { NotificationService } from '@/notification/notification.service';
import { filterAvailableRides } from '@/utils/rides';
import { WsEvent } from '@/websocket/events';
import { LiveUpdatesService } from '@/websocket/live-updates.service';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Point } from 'geojson';
import { omit } from 'lodash';
import { DeepPartial, Repository, SelectQueryBuilder } from 'typeorm';
import { AiProducer } from '../ai/ai.producer';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';

@Injectable()
export class RideService {
  private readonly logger = new Logger(RideService.name);

  constructor(
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,
    private readonly embeddingProducer: AiProducer,
    private readonly notificationService: NotificationService,
    private readonly liveUpdatesService: LiveUpdatesService,
  ) {}

  private createRideQueryBuilder(alias = 'ride') {
    return this.ridesRepository
      .createQueryBuilder(alias)
      .innerJoinAndSelect(
        `${alias}.organization`,
        'organization',
        'organization.isDeleted = false',
      )
      .innerJoinAndSelect(
        `${alias}.driver`,
        'driver',
        'driver.isDeleted = false',
      )
      .leftJoinAndSelect(
        `${alias}.rideStops`,
        'rideStops',
        'rideStops.isDeleted = false',
      )
      .leftJoinAndSelect(
        `${alias}.passengers`,
        'passengers',
        'passengers.isDeleted = false',
      )
      .leftJoinAndSelect(
        'passengers.rideStop',
        'passengerRideStop',
        'passengerRideStop.isDeleted = false',
      )
      .leftJoinAndSelect(
        'passengers.user',
        'passengerUser',
        'passengerUser.isDeleted = false',
      )
      .where(`${alias}.isDeleted = false`);
  }

  private sanitizeRideRelations(ride: Ride): Ride {
    ride.passengers =
      ride.passengers?.filter(
        (passenger) => passenger?.user && passenger?.rideStop,
      ) ?? [];
    return ride;
  }

  private sanitizeRideCollection(rides: Ride[]): Ride[] {
    return rides.map((ride) => this.sanitizeRideRelations(ride));
  }

  private addActiveOrFutureRidesFilter(
    queryBuilder: SelectQueryBuilder<Ride>,
    alias = 'ride',
  ): SelectQueryBuilder<Ride> {
    return queryBuilder.andWhere(
      `(${alias}.estimatedEndsAt >= :now OR ${alias}.rideStatus = :active) AND ${alias}.rideStatus != :cancelled AND ${alias}.rideStatus != :done`,
      {
        now: new Date(),
        active: RideStatus.ACTIVE,
        cancelled: RideStatus.CANCELLED,
        done: RideStatus.DONE,
      },
    );
  }

  private addHistoryRidesFilter(
    queryBuilder: SelectQueryBuilder<Ride>,
    alias = 'ride',
  ): SelectQueryBuilder<Ride> {
    return queryBuilder.andWhere(`${alias}.rideStatus = :done`, {
      done: RideStatus.DONE,
    });
  }

  private addPassengerFilter(
    queryBuilder: SelectQueryBuilder<Ride>,
    passengerId: User['id'],
  ): SelectQueryBuilder<Ride> {
    return queryBuilder.innerJoin(
      'ride.passengers',
      'passengerFilter',
      'passengerFilter.userId = :passengerId AND passengerFilter.isDeleted = false',
      { passengerId },
    );
  }

  async createRide({
    organizationId,
    driverId,
    ...restOfFields
  }: CreateRideDto): Promise<Ride> {
    const newRideData = { ...restOfFields } as Record<string, unknown>;
    omit(newRideData, 'startLocation');
    omit(newRideData, 'endLocation');

    const newRide = this.ridesRepository.create({
      ...newRideData,
      organization: { id: organizationId },
      driver: { id: driverId },
    } as DeepPartial<Ride>);

    try {
      const createdRide = await this.ridesRepository.save(newRide);
      const ride = await this.getRideById(createdRide.id);

      this.liveUpdatesService.broadcastRideChange({
        event: WsEvent.RIDE_CREATED,
        ride,
        organizationId: ride.orgId,
      });

      this.embeddingProducer
        .queueRideEmbedding(ride.id)
        .catch((err: unknown) =>
          this.logger.error(
            `Failed to queue embedding for ride ${ride.id}`,
            err,
          ),
        );

      return ride;
    } catch (error) {
      this.logger.error(
        `Failed to create ride, ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new ConflictException('Failed to create ride');
    }
  }

  async getAvailableRides(orgId: Ride['orgId']): Promise<Ride[]> {
    const now = new Date();

    const rides = await this.createRideQueryBuilder()
      .andWhere('ride.rideStatus = :status', { status: RideStatus.PENDING })
      .andWhere('ride.startsAt > :now', { now })
      .andWhere('ride.orgId = :orgId', { orgId })
      .getMany();

    return filterAvailableRides(this.sanitizeRideCollection(rides));
  }

  async getRideById(id: Ride['id']): Promise<Ride> {
    const ride = await this.createRideQueryBuilder()
      .andWhere('ride.id = :id', { id })
      .getOne();

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    return this.sanitizeRideRelations(ride);
  }

  async getRidesByOrganizationId(
    organizationId: Organization['id'],
  ): Promise<Ride[]> {
    const rides = await this.createRideQueryBuilder()
      .andWhere('ride.orgId = :organizationId', { organizationId })
      .getMany();

    return this.sanitizeRideCollection(rides);
  }

  async getRidesByDriverId(driverId: User['id']): Promise<Ride[]> {
    const query = this.createRideQueryBuilder().andWhere(
      'ride.driverId = :driverId',
      { driverId },
    );

    const rides = await this.addActiveOrFutureRidesFilter(query)
      .orderBy('ride.startsAt', 'ASC')
      .getMany();

    return this.sanitizeRideCollection(rides);
  }

  async getRidesByPassengerId(passengerId: User['id']): Promise<Ride[]> {
    const query = this.addPassengerFilter(
      this.createRideQueryBuilder(),
      passengerId,
    );

    const rides = await this.addActiveOrFutureRidesFilter(query)
      .orderBy('ride.startsAt', 'ASC')
      .getMany();

    return this.sanitizeRideCollection(rides);
  }

  async getRideHistoryByDriverId(driverId: User['id']): Promise<Ride[]> {
    const query = this.createRideQueryBuilder().andWhere(
      'ride.driverId = :driverId',
      { driverId },
    );

    const rides = await this.addHistoryRidesFilter(query)
      .orderBy('ride.startsAt', 'DESC')
      .getMany();

    return this.sanitizeRideCollection(rides);
  }

  async getRideHistoryByPassengerId(passengerId: User['id']): Promise<Ride[]> {
    const query = this.addPassengerFilter(
      this.createRideQueryBuilder(),
      passengerId,
    );

    const rides = await this.addHistoryRidesFilter(query)
      .orderBy('ride.startsAt', 'DESC')
      .getMany();

    return this.sanitizeRideCollection(rides);
  }

  async getActiveRideByPassengerId(
    passengerId: User['id'],
  ): Promise<Ride | null> {
    const ride = await this.addPassengerFilter(
      this.createRideQueryBuilder(),
      passengerId,
    )
      .andWhere('ride.rideStatus = :status', { status: RideStatus.ACTIVE })
      .getOne();

    if (!ride) return null;

    return this.sanitizeRideRelations(ride);
  }

  async updateRide(
    id: Ride['id'],
    { organizationId, driverId, rideStops, ...rest }: UpdateRideDto,
  ): Promise<Ride> {
    const payload = { ...rest } as Record<string, unknown>;
    omit(payload, 'startLocation');
    omit(payload, 'endLocation');

    const preloadPayload: DeepPartial<Ride> = { id, ...payload };

    if (organizationId) preloadPayload.orgId = organizationId;
    if (driverId) preloadPayload.driverId = driverId;
    if (rideStops) preloadPayload.rideStops = rideStops;

    const existingRide = await this.getRideById(id);
    const wasPending = existingRide.rideStatus === RideStatus.PENDING;
    const isBecomingActive = rest.rideStatus === RideStatus.ACTIVE;

    const ride = await this.ridesRepository.preload(preloadPayload);

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    try {
      const updatedRide = await this.ridesRepository.save(ride);

      const finalRide = await this.getRideById(updatedRide.id);

      if (wasPending && isBecomingActive) {
        await this.sendRideStartedNotifications(finalRide);
      }

      if (rideStops && finalRide.rideStatus === RideStatus.PENDING) {
        this.embeddingProducer
          .queueRideEmbedding(finalRide.id)
          .catch((err: unknown) =>
            this.logger.error(
              `Failed to queue embedding for ride ${finalRide.id}`,
              err,
            ),
          );
      }

      this.liveUpdatesService.broadcastRideChange({
        event: WsEvent.RIDE_UPDATED,
        ride: finalRide,
        organizationId: finalRide.orgId,
      });

      if (finalRide.rideStatus === RideStatus.DONE) {
        const passengerIds = finalRide.passengers
          .filter((p) => p.user)
          .map((p) => p.userId);

        await this.embeddingProducer.queueRideCompletionTasks(
          finalRide.id,
          finalRide.driverId,
          passengerIds,
        );
      }

      return finalRide;
    } catch (error) {
      this.logger.error(
        `Failed to update ride with ID ${id}, ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new ConflictException(`Failed to update ride with ID ${id}`);
    }
  }

  private async sendRideStartedNotifications(ride: Ride): Promise<void> {
    const content = `הנסיעה עם ${ride.driver.fullName} התחילה!`;
    // Create DB notification
    if (ride.passengers && ride.passengers.length > 0) {
      const notificationDtos: CreateNotificationDto[] = ride.passengers.map(
        (passenger) => ({
          creatorId: ride.driver.id,
          recipientId: passenger.userId,
          rideId: ride.id,
          content,
        }),
      );
      await this.notificationService.createBulk(notificationDtos);
    }

    // Send WS notification to all passengers
    const passengerIds = ride.passengers.map((p) => p.userId);

    this.liveUpdatesService.broadcastRideStartedNotification({
      passengerIds,
      payload: {
        content,
        driver: ride.driver,
        rideId: ride.id,
      },
    });
  }

  async deleteRide(id: Ride['id']): Promise<void> {
    const ride = await this.getRideById(id);
    const result = await this.ridesRepository.update(id, { isDeleted: true });
    if (result.affected === 0) {
      this.logger.error(`Ride with ID ${id} not found`);
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    this.liveUpdatesService.broadcastRideChange({
      event: WsEvent.RIDE_DELETED,
      ride,
      organizationId: ride.orgId,
    });
  }

  async validateRideRelevance(
    id: Ride['id'],
  ): Promise<{ isRelevant: boolean; reason?: string }> {
    try {
      const ride = await this.createRideQueryBuilder()
        .andWhere('ride.id = :id', { id })
        .getOne();

      if (!ride) {
        return { isRelevant: false, reason: 'RIDE_NOT_FOUND' };
      }

      const now = new Date();

      if (ride.rideStatus === RideStatus.ACTIVE) {
        return { isRelevant: false, reason: 'RIDE_ACTIVE' };
      } else if (new Date(ride.startsAt) < now) {
        return { isRelevant: false, reason: 'RIDE_TIME_PASSED' };
      }

      if (ride.rideStatus === RideStatus.CANCELLED) {
        return { isRelevant: false, reason: 'RIDE_CANCELLED' };
      }

      if (ride.rideStatus === RideStatus.DONE) {
        return { isRelevant: false, reason: 'RIDE_COMPLETED' };
      }

      const passengerCount =
        ride.passengers?.filter((passenger) => !passenger.isDeleted).length ||
        0;
      const availableSeats = ride.maxSeatsAmount - passengerCount;
      if (availableSeats <= 0) {
        return { isRelevant: false, reason: 'RIDE_FULL' };
      }

      return { isRelevant: true };
    } catch (error) {
      this.logger.error(
        `Error validating ride relevance (rideId=${id})`,
        error,
      );
      return { isRelevant: false, reason: 'VALIDATION_ERROR' };
    }
  }

  getRideLocations = async (rideId: Ride['id']) => {
    try {
      const ride = await this.getRideById(rideId);

      const driverLocationPayload = ride.driver.currentLocation
        ? ({
            type: 'DRIVER',
            id: ride.driver.id,
            location: ride.driver.currentLocation,
            name: `${ride.driver.fullName} (נהג/ת)`,
          } satisfies RideEntityLocationPayloadWithFullDetails)
        : undefined;

      const ridePassengersLocationPayloads = ride.passengers
        .filter(({ user }) => !!user.currentLocation)
        .map(
          ({ user: { id, currentLocation, fullName } }) =>
            ({
              type: 'PASSENGER',
              id,
              location: currentLocation as Point,
              name: `${fullName} (נוסע/ת)`,
            }) satisfies RideEntityLocationPayloadWithFullDetails,
        );

      const rideStopsLocationPayloads = ride.rideStops.map(
        ({ location, id, locationName, orderIndex }) =>
          ({
            type: 'STOP',
            id,
            location,
            name: `תחנה ${orderIndex + 1} - ${locationName}`,
          }) satisfies RideEntityLocationPayloadWithFullDetails,
      );

      const rideLocationPayloads = [
        ...(driverLocationPayload ? [driverLocationPayload] : []),
        ...ridePassengersLocationPayloads,
        ...rideStopsLocationPayloads,
      ];

      return rideLocationPayloads;
    } catch (error) {
      this.logger.error(
        `Error while getting ride locations (rideId=${rideId})`,
        error,
      );
    }
  };
}
