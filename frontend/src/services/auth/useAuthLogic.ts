import { tokenStorage } from '@/api/tokenStorage';
import { useQuery } from '@tanstack/react-query';
import { useLoginMutation, useLogoutMutation, useMeQuery } from './authQueries';
import { useValidateAccessToken } from './useValidateAccessToken';

export type UseAuthLogicContent = ReturnType<typeof useAuthLogic>;

export const useAuthLogic = () => {
  const { data: hasAccessToken, isLoading: isAccessTokenLoading } = useQuery({
    queryKey: ['auth', 'token'],
    queryFn: () => tokenStorage.getAccessToken(),
    staleTime: Infinity,
  });

  const {
    data: user = null,
    isLoading: isUserLoading,
    refetch: refreshUser,
  } = useMeQuery(!isAccessTokenLoading && !!hasAccessToken);

  const { mutateAsync: login } = useLoginMutation();
  const { mutateAsync: logout } = useLogoutMutation();

  useValidateAccessToken({ user });

  return { user, isUserLoading, refreshUser, login, logout };
};
