import { i18n } from '@/i18n';
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api as baseApi } from './api';
import { CreateUserDto, UpdateUserDto, User } from './user';
import { UserErrorCode } from './user-error-codes';

type PaginatedUsersResponse = {
  data: User[];
  total: number;
  hasNextPage: boolean;
};

export const fetchUsers = async (
  orgId: string,
  page: number = 1,
  search: string = '',
): Promise<PaginatedUsersResponse> => {
  const { data } = await baseApi.get<PaginatedUsersResponse>(`/users/organization/${orgId}`, {
    params: { page, limit: 15, search },
  });
  return data;
};

export const createUser = async (user: CreateUserDto): Promise<User> => {
  const { data } = await baseApi.post<User>('/users', user);
  return data;
};

export const updateUser = async ({ id, ...user }: { id: string } & UpdateUserDto): Promise<User> => {
  const { data } = await baseApi.patch<User>(`/users/${id}`, user);
  return data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await baseApi.delete(`/users/${id}`);
};

export const getErrorMessage = (err: Error) => {
  if (err instanceof AxiosError && err.response?.data?.message) {
    const msg = err.response.data.message;
    if (msg === UserErrorCode.USER_ALREADY_EXISTS) return i18n.hr_popup.user_already_exists;
    if (msg === UserErrorCode.USER_NOT_FOUND) return i18n.hr_popup.user_not_found;
    if (msg === UserErrorCode.FAILED_TO_CREATE_USER) return i18n.hr_popup.failed_to_create_user;
  }
  return i18n.hr_popup.error;
};

export const useCreateUser = (options?: UseMutationOptions<User, Error, CreateUserDto>) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: createUser,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      options?.onSuccess?.(...args);
    },
  });
};

export const useUpdateUser = (options?: UseMutationOptions<User, Error, { id: string } & UpdateUserDto>) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: updateUser,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      options?.onSuccess?.(...args);
    },
  });
};

export const useDeleteUser = (options?: UseMutationOptions<void, Error, string>) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: deleteUser,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      options?.onSuccess?.(...args);
    },
  });
};
