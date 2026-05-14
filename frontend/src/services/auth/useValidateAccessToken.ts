import { tokenStorage } from '@/api/tokenStorage';
import type { User } from '@/api/user';
import { useQueryClient } from '@tanstack/react-query';
import { useEventListener } from 'usehooks-ts';
import { clearUserCache } from './authQueries';

export type UseValidateAccessTokenArgs = { user: User | null };

export type UseValidateAccessTokenContent = ReturnType<typeof useValidateAccessToken>;

export const useValidateAccessToken = ({ user }: UseValidateAccessTokenArgs) => {
  const queryClient = useQueryClient();

  const updateUserIdFromAccessToken = async (accessToken: string | null) => {
    const userId = accessToken ? tokenStorage.getUserIdFromAccessToken(accessToken) : null;

    if (userId) await tokenStorage.setUserId(userId);
    else await tokenStorage.clearUserId();
  };

  const validateAccessToken = async () => {
    const accessToken = await tokenStorage.getAccessToken();

    if (!accessToken && !!user) {
      await tokenStorage.clearAll();

      await clearUserCache(queryClient);
    }

    // ? If the access token was updated

    await updateUserIdFromAccessToken(accessToken);

    if (accessToken) return await tokenStorage.setAccessToken(accessToken);
  };

  useEventListener('storage', validateAccessToken);
};
