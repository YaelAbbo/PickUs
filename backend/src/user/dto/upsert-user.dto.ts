import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Point } from 'geojson';
import { UserRole } from '../../database/entities/user.entity';
import { IsPoint } from '../../utils/decorators/is-point.decorator';

export class UpsertUserDto {
  @IsString()
  firstName?: string;

  @IsString()
  lastName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsOptional()
  @IsPoint()
  currentLocation?: Point;

  @IsString()
  @IsOptional()
  profileImageUrl?: string | null;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
