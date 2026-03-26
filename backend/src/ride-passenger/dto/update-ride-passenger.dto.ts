import type { RideStop } from '@/database/entities';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateRidePassengerDto {
  @IsUUID()
  @IsNotEmpty()
  rideStopId: RideStop['id'];
}
