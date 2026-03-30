import type { UUID } from 'crypto';
import type { Organization } from './organization';

export enum UserRole {
  BASIC_USER = 'BASIC_USER',
  HR_MANAGER = 'HR_MANAGER',
  ADMIN = 'ADMIN',
}

export type User = {
  id: UUID;
  nationalId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  orgId: UUID;
  organization?: Pick<Organization, 'id' | 'name' | 'imageUrl'>;
  isTempPassword: boolean;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  password: string;
};

export type CreateUserDto = Omit<
  User,
  'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'isTempPassword' | 'profileImageUrl'
>;
export type UpdateUserDto = Partial<CreateUserDto>;
