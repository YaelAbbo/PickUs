import type { User } from '@schemas';
import type { QueryClient } from '@tanstack/react-query';
import { authKeys } from './authKeys';

export const clearUserCache = async (queryClient: QueryClient) => {
  await queryClient.cancelQueries({ queryKey: authKeys.me() });

  await queryClient.invalidateQueries({ queryKey: authKeys.me() });

  queryClient.setQueryData<User | null>(authKeys.me(), null);
  queryClient.setQueryData<string | null>(authKeys.token(), null);
};
