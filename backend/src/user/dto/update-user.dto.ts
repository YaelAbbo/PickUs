import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Point } from 'geojson';
import { UserRole } from '../../database/entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsOptional()
  currentLocation?: Point;

  @IsString()
  @IsOptional()
  @Transform(({ obj }) =>
    obj.isDeleteImage === true ? null : obj.profileImageUrl,
  )
  profileImageUrl?: string | null;

  @IsBoolean()
  @IsOptional()
  @Transform(({ obj, value }) => (obj.profileImageUrl ? false : value))
  isDeleteImage?: boolean;
}
