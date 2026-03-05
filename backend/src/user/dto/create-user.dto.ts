import { Point } from 'geojson';
import { UserRole } from '../../database/entities/user.entity';

export class CreateUserDto {
  firstName: string;
  lastName: string;
  nationalId: string;
  role?: UserRole;
  organizationId: string;
  currentLocation?: Point;
  profileImageUrl?: string;
}
