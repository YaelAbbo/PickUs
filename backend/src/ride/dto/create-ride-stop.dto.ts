import { IsPoint } from '@/utils/decorators/is-point.decorator';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import type { Point } from 'geojson';

export class CreateRideStopDto {
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
