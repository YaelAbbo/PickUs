export enum UserRole {
  BASIC_USER = 'BASIC_USER',
  HR_MANAGER = 'HR_MANAGER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  orgId: string;
  organization?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  isTempPassword: boolean;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export type CreateUserDto = Omit<
  User,
  'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'isTempPassword' | 'profileImageUrl'
> & { nationalId: string };
export type UpdateUserDto = Partial<CreateUserDto>;
