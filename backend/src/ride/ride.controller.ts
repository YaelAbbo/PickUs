import { CurrentUserId, UseAccessAuth } from '@/auth/decorators';
import { Organization, Ride, User } from '@/database/entities';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { RideService } from './ride.service';

@Controller('rides')
export class RideController {
  constructor(private readonly rideService: RideService) {}

  @UseAccessAuth()
  @Post()
  async createRide(@Body() createRideDto: CreateRideDto): Promise<Ride> {
    return await this.rideService.createRide(createRideDto);
  }

  @UseAccessAuth()
  @Get()
  async getAllRides(): Promise<Ride[]> {
    return await this.rideService.getAllRides();
  }

  // Needs to be above @Get(':id') so 'available' won't be treated as a parameter
  @UseAccessAuth()
  @Get('available')
  async getAvailableRides(
    @Query('orgId') orgId: Ride['orgId'],
  ): Promise<Ride[]> {
    if (!orgId) {
      throw new BadRequestException('orgId query parameter is required');
    }

    return await this.rideService.getAvailableRides(orgId);
  }

  @UseAccessAuth()
  @Get('active-ride')
  async getActiveRideByPassengerId(
    @CurrentUserId() passengerId: User['id'],
  ): Promise<Ride | null> {
    return await this.rideService.getActiveRideByPassengerId(passengerId);
  }

  @UseAccessAuth()
  @Get(':id')
  async getRideById(@Param('id') id: Ride['id']): Promise<Ride> {
    return await this.rideService.getRideById(id);
  }

  @UseAccessAuth()
  @Get('organization/:organizationId')
  async getRidesByOrganizationId(
    @Param('organizationId') organizationId: Organization['id'],
  ): Promise<Ride[]> {
    return await this.rideService.getRidesByOrganizationId(organizationId);
  }

  @UseAccessAuth()
  @Get('driver/:driverId')
  async getRidesByDriverId(
    @Param('driverId') driverId: User['id'],
  ): Promise<Ride[]> {
    return await this.rideService.getRidesByDriverId(driverId);
  }

  @Get(':rideId/locations')
  @UseAccessAuth()
  async getRideLocations(@Param('rideId') rideId: Ride['id']) {
    return await this.rideService.getRideLocations(rideId);
  }

  @UseAccessAuth()
  @Get('passenger/:passengerId')
  async getRidesByPassengerId(
    @Param('passengerId') passengerId: User['id'],
  ): Promise<Ride[]> {
    return await this.rideService.getRidesByPassengerId(passengerId);
  }

  @UseAccessAuth()
  @Patch(':id')
  async updateRide(
    @Param('id') id: Ride['id'],
    @Body() updateRideDto: UpdateRideDto,
  ): Promise<Ride> {
    return await this.rideService.updateRide(id, updateRideDto);
  }

  @UseAccessAuth()
  @Delete(':id')
  async deleteRide(@Param('id') id: Ride['id']): Promise<void> {
    return await this.rideService.deleteRide(id);
  }
}
