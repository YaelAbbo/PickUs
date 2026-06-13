import { getNotifications } from '@/api/notification.api';
import { useQuery } from '@tanstack/react-query';

export const notificationKeys = {
  all: ['notifications'] as const,
  user: (userId: string) => [...notificationKeys.all, userId] as const,
};

export const useNotifications = (userId?: string) => {
  return useQuery({
    queryKey: notificationKeys.user(userId!),
    queryFn: () => getNotifications(userId!),
    enabled: !!userId,
  });
};
