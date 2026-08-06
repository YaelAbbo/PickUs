import { tokenStorage } from '@/api/tokenStorage';
import { websocketService } from '@/services/websocket';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authKeys } from './authKeys';
import { useLoginMutation, useLogoutMutation, useMeQuery } from './authQueries';
import { useValidateAccessToken } from './useValidateAccessToken';

export type UseAuthLogicContent = ReturnType<typeof useAuthLogic>;

export const useAuthLogic = () => {
  const { data: hasAccessToken, isLoading: isAccessTokenLoading } = useQuery({
    queryKey: authKeys.token(),
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

  useEffect(() => {
    if (user) {
      tokenStorage.getAccessToken().then((token) => {
        if (token) websocketService.connect(token);
      });
    } else {
      websocketService.disconnect();
    }
  }, [user]);

  return { user, isUserLoading, refreshUser, login, logout };
};
