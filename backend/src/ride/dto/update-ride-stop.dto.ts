import type { RideStop } from '@/database/entities';
import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateRideStopDto } from './create-ride-stop.dto';

export class UpdateRideStopDto extends PartialType(CreateRideStopDto) {
  @IsUUID()
  @IsOptional()
  id?: RideStop['id'];
}
