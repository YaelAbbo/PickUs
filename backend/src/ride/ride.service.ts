import {
  Ride,
  RideStatus,
  type Organization,
  type User,
} from '@/database/entities';
import { filterAvailableRides } from '@/utils/rides';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { omit } from 'lodash';
import { DeepPartial, Repository } from 'typeorm';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';

@Injectable()
export class RideService {
  private readonly logger = new Logger(RideService.name);

  constructor(
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,
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
      return await this.getRideById(createdRide.id);
    } catch (error) {
      this.logger.error(
        `Failed to create ride, ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new ConflictException('Failed to create ride');
    }
  }

  async getAllRides(): Promise<Ride[]> {
    const rides = await this.createRideQueryBuilder().getMany();
    return this.sanitizeRideCollection(rides);
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
    const rides = await this.createRideQueryBuilder()
      .andWhere('ride.driverId = :driverId', { driverId })
      .getMany();

    return this.sanitizeRideCollection(rides);
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

    const ride = await this.ridesRepository.preload(preloadPayload);

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    try {
      const updatedRide = await this.ridesRepository.save(ride);
      return await this.getRideById(updatedRide.id);
    } catch (error) {
      this.logger.error(
        `Failed to update ride with ID ${id}, ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new ConflictException(`Failed to update ride with ID ${id}`);
    }
  }

  async deleteRide(id: Ride['id']): Promise<void> {
    const result = await this.ridesRepository.update(id, { isDeleted: true });
    if (result.affected === 0) {
      this.logger.error(`Ride with ID ${id} not found`);
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }
  }
}
