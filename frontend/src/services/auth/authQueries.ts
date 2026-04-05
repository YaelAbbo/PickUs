import type { User } from '@schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from './authService';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export const clearUserCache = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await queryClient.cancelQueries({ queryKey: authKeys.me() });

  queryClient.setQueryData<User | null>(authKeys.me(), null);
};

/**
 * Fetches the current user. Enabled only when a stored token exists.
 * Used by AuthContext to rehydrate session on app start.
 */
export const useMeQuery = (enabled = true) =>
  useQuery({
    queryKey: authKeys.me(),
    queryFn: authService.getMe,
    enabled,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => clearUserCache(queryClient),
  });
};
