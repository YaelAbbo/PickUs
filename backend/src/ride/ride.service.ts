import { Ride, type Organization, type User } from '@/database/entities';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';

@Injectable()
export class RideService {
  constructor(
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,
  ) {}

  async createRide({
    organizationId,
    ...createRideDto
  }: CreateRideDto): Promise<Ride> {
    const newRide = this.ridesRepository.create({
      orgId: organizationId,
      ...createRideDto,
    });

    try {
      const createdRide = await this.ridesRepository.save(newRide);

      return await this.getRideById(createdRide.id);
    } catch (err) {
      console.error(err);
      throw new ConflictException('Failed to create ride');
    }
  }

  async getAllRides(): Promise<Ride[]> {
    return await this.ridesRepository.find({
      where: { isDeleted: false },
      relations: ['organization', 'driver', 'rideStops'],
    });
  }

  async getRideById(id: Ride['id']): Promise<Ride> {
    const ride = await this.ridesRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['organization', 'driver', 'rideStops'],
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    return ride;
  }

  async getRidesByOrganizationId(
    organizationId: Organization['id'],
  ): Promise<Ride[]> {
    return await this.ridesRepository.find({
      where: { orgId: organizationId, isDeleted: false },
      relations: ['driver', 'rideStops'],
    });
  }

  async getRidesByDriverId(driverId: User['id']): Promise<Ride[]> {
    return await this.ridesRepository.find({
      where: { driverId, isDeleted: false },
      relations: ['organization', 'rideStops'],
    });
  }

  async updateRide(
    id: Ride['id'],
    { organizationId, driverId, rideStops, ...rest }: UpdateRideDto,
  ): Promise<Ride> {
    const preloadPayload: DeepPartial<Ride> = {
      id,
      ...rest,
    };

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
    } catch (err) {
      console.error(err);
      throw new ConflictException(`Failed to update ride with ID ${id}`);
    }
  }

  async deleteRide(id: Ride['id']): Promise<void> {
    const result = await this.ridesRepository.update(id, { isDeleted: true });

    if (result.affected === 0) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }
  }
}
