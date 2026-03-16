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
import { Point } from 'geojson';
import { IsPoint } from '../../utils/decorators/is-point.decorator';
import { CreateRideStopDto } from './create-ride-stop.dto';
import type { Organization, User } from '@/database/entities';

export class CreateRideDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId: Organization['id'];

  @IsUUID()
  @IsNotEmpty()
  driverId: User['id'];

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startsAt: Date;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  estimatedEndsAt: Date;

  @IsPoint()
  @IsNotEmpty()
  startLocation: Point;

  @IsPoint()
  @IsNotEmpty()
  endLocation: Point;

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
  @IsOptional()
  rideStops?: CreateRideStopDto[];
}
