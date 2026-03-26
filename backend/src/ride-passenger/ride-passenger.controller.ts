import { UseAccessAuth } from '@/auth/decorators';
import { CurrentUserId } from '@/auth/decorators/currentUserId.decorator';
import { Ride, User } from '@/database/entities';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { JoinRideDto } from './dto/join-ride.dto';
import { UpdateRidePassengerDto } from './dto/update-ride-passenger.dto';
import { RidePassengerService } from './ride-passenger.service';

@Controller('rides')
export class RidePassengerController {
  constructor(private readonly ridePassengerService: RidePassengerService) {}

  @UseAccessAuth()
  @Post(':rideId/passengers')
  async joinRide(
    @Param('rideId') rideId: Ride['id'],
    @CurrentUserId() userId: User['id'],
    @Body() joinRideDto: JoinRideDto,
  ): Promise<void> {
    await this.ridePassengerService.joinRide(rideId, userId, joinRideDto);
  }

  @UseAccessAuth()
  @Patch(':rideId/passengers/:userId')
  async updateRideStop(
    @Param('rideId') rideId: Ride['id'],
    @Param('userId') userId: User['id'],
    @CurrentUserId() currentUserId: User['id'],
    @Body() updateDto: UpdateRidePassengerDto,
  ): Promise<void> {
    await this.ridePassengerService.updateRideStop(
      rideId,
      userId,
      currentUserId,
      updateDto,
    );
  }

  @UseAccessAuth()
  @Delete(':rideId/passengers/:userId')
  @HttpCode(204)
  async leaveRide(
    @Param('rideId') rideId: Ride['id'],
    @Param('userId') userId: User['id'],
    @CurrentUserId() currentUserId: User['id'],
  ): Promise<void> {
    await this.ridePassengerService.leaveRide(rideId, userId, currentUserId);
  }
}
