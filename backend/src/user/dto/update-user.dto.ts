import { Point } from 'geojson';
import { UserRole } from '../../database/entities/user.entity';

export class UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  currentLocation?: Point;
  profileImageUrl?: string;
  isDeleteImage?: boolean;
}
