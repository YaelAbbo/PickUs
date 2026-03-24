import { BASE_URL } from '@/utils/constants';
import axios from 'axios';
import { tokenStorage } from './tokenStorage';
import { CreateUserDto, UpdateUserDto, User } from './user';

const API_URL = BASE_URL;

const userApi = axios.create({
  baseURL: `${API_URL}/users`,
  headers: {
    'Content-Type': 'application/json',
  },
});

userApi.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getAccessToken(); 
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
