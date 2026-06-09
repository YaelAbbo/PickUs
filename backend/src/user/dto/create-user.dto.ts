import type { User } from '@/database/entities';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { UpsertUserDto } from './upsert-user.dto';

export class CreateUserDto extends UpsertUserDto {
  @IsNotEmpty()
  declare firstName: User['firstName'];

  @IsNotEmpty()
  declare lastName: User['lastName'];

  @IsString()
  @IsNotEmpty()
  nationalId: User['nationalId'];

  @IsEmail()
  @IsNotEmpty()
  declare email: User['email'];

  @IsString()
  @IsNotEmpty()
  declare phoneNumber: User['phoneNumber'];

  @IsString()
  @IsNotEmpty()
  orgId: User['orgId'];
}
