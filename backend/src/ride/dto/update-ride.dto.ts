import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { CreateRideDto } from './create-ride.dto';
import { UpdateRideStopDto } from './update-ride-stop.dto';

export class UpdateRideDto extends PartialType(
  OmitType(CreateRideDto, ['rideStops']),
) {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRideStopDto)
  @IsNotEmpty()
  rideStops: UpdateRideStopDto[];
}
