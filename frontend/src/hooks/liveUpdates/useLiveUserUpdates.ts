import type { User } from '@/api/user';
import { useAuth } from '@/services/auth/AuthContext';
import { WsEvent, authKeys, websocketService } from '@services';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

type LiveUserUpdatePayload = { user: Pick<User, 'id' | 'orgId'> };

export const useLiveUserUpdates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const organizationId = user?.organization?.id;

    if (!organizationId) return;

    const handler = (payload: LiveUserUpdatePayload) => {
      if (payload.user.orgId !== organizationId) return;

      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      if (payload.user.id === user.id) queryClient.invalidateQueries({ queryKey: authKeys.me() });
    };

    const unsubscribe = websocketService.on(WsEvent.USER_UPDATED, handler);

    return () => unsubscribe();
  }, [queryClient, user]);
};
