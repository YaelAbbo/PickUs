import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { UpsertUserDto } from './upsert-user.dto';

export class UpdateUserDto extends UpsertUserDto {
  @IsOptional()
  declare firstName?: string;

  @IsOptional()
  declare lastName?: string;

  @IsOptional()
  @Transform(({ obj }) =>
    obj.isDeleteImage === true ? null : obj.profileImageUrl,
  )
  declare profileImageUrl?: string | null;

  @IsBoolean()
  @IsOptional()
  @Transform(({ obj, value }) => (obj.profileImageUrl ? false : value))
  isDeleteImage?: boolean;

  @IsOptional()
  declare password?: string;
}
