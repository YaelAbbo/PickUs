import type { RideStop } from '@/database/entities';
import { PartialType } from '@nestjs/mapped-types';
import { IsUUID } from 'class-validator';
import { CreateRideStopDto } from './create-ride-stop.dto';

export class UpdateRideStopDto extends PartialType(CreateRideStopDto) {
  @IsUUID()
  id: RideStop['id'];
}
