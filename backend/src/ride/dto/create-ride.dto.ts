import { RideStatus } from '@/database/entities/ride.entity';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import type { UUID } from 'crypto';
import { CreateRideStopDto } from './create-ride-stop.dto';

export class CreateRideDto {
  @IsUUID()
  @IsNotEmpty()
  orgId: UUID;

  @IsUUID()
  @IsNotEmpty()
  driverId: UUID;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startsAt: Date;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  estimatedEndsAt: Date;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  maxSeatsAmount: number;

  @IsEnum(RideStatus)
  @IsOptional()
  rideStatus?: RideStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRideStopDto)
  @IsNotEmpty()
  rideStops: CreateRideStopDto[];
}
