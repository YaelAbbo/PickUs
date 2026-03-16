import type { User } from '@/database/entities';
import { IsNotEmpty, IsString } from 'class-validator';
import { UpsertUserDto } from './upsert-user.dto';

export class CreateUserDto extends UpsertUserDto {
  @IsNotEmpty()
  declare firstName: User['firstName'];

  @IsNotEmpty()
  declare lastName: User['lastName'];

  @IsString()
  @IsNotEmpty()
  nationalId: User['nationalId'];

  @IsString()
  @IsNotEmpty()
  organizationId: User['orgId'];
}
