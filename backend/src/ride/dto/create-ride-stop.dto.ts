import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsObject,
  Min,
  ValidateNested,
} from 'class-validator';
import type { Point } from 'geojson';

export class CreateRideStopDto {
  @IsObject()
  @ValidateNested()
  @IsNotEmpty()
  location: Point;

  @IsDate()
  @IsNotEmpty()
  estimatedArrivalAt: Date;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  orderIndex: number;
}
