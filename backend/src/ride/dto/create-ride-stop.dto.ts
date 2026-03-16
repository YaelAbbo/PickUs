import { IsPoint } from '@/utils/decorators/is-point.decorator';
import { IsDate, IsInt, IsNotEmpty, Min } from 'class-validator';
import type { Point } from 'geojson';

export class CreateRideStopDto {
  @IsPoint()
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
