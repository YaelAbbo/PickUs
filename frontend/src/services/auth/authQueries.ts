import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authKeys } from './authKeys';
import { authService } from './authService';
import { clearUserCache } from './utils';

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
      // Set token state synchronously to avoid race condition with me query
      queryClient.setQueryData(authKeys.token(), true);
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
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
