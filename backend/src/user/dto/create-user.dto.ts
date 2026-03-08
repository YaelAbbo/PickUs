import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Point } from 'geojson';
import { UserRole } from '../../database/entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsOptional()
  currentLocation?: Point;

  @IsString()
  @IsOptional()
  profileImageUrl?: string;

  @IsString()
  @IsNotEmpty()
  organizationId: string;
}
