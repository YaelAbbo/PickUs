import type { RideStop } from '@/database/entities';
import { IsPoint } from '@/utils/decorators/is-point.decorator';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import type { Point } from 'geojson';

export class CreateRideStopDto {
  @IsUUID()
  @IsOptional()
  id?: RideStop['id'];

  @IsPoint()
  @IsNotEmpty()
  location: Point;

  @IsString()
  @IsNotEmpty()
  locationName: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  estimatedArrivalAt: Date;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  orderIndex: number;
}
