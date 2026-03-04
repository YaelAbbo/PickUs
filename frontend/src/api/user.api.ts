import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100/api';

export enum UserRole {
  BASIC_USER = 'BASIC_USER',
  HR_MANAGER = 'HR_MANAGER',
  ADMIN = 'ADMIN',
  AI = 'AI',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
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

const userApi = axios.create({
  baseURL: `${API_URL}/users`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PaginatedUsersResponse {
  data: User[];
  total: number;
  hasNextPage: boolean;
}

export const fetchUsers = async (
  orgId: string,
  page: number = 1,
  search: string = '',
): Promise<PaginatedUsersResponse> => {
  const { data } = await userApi.get<PaginatedUsersResponse>(`/organization/${orgId}`, {
    params: { page, limit: 15, search },
  });
  return data;
};

export const createUser = async (user: CreateUserDto): Promise<User> => {
  const { data } = await userApi.post<User>('/', user);
  return data;
};

export const updateUser = async ({ id, ...user }: { id: string } & UpdateUserDto): Promise<User> => {
  const { data } = await userApi.patch<User>(`/${id}`, user);
  return data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await userApi.delete(`/${id}`);
};
