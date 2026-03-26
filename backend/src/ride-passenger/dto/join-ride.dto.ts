import type { RideStop } from '@/database/entities';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class JoinRideDto {
  @IsUUID()
  @IsNotEmpty()
  rideStopId: RideStop['id'];
}
