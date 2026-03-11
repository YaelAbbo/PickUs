import { IsNotEmpty, IsString } from 'class-validator';
import { UpsertUserDto } from './upsert-user.dto';

export class CreateUserDto extends UpsertUserDto {
  @IsNotEmpty()
  declare firstName: string;

  @IsNotEmpty()
  declare lastName: string;

  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @IsString()
  @IsNotEmpty()
  organizationId: string;
}
