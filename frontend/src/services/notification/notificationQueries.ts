import { Notification, getNotifications } from '@/api/notification.api';
import { UserRole } from '@/api/user';
import { useQuery } from '@tanstack/react-query';

const MOCK_NOTIFICATIONS: Notification[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `mock-${i}` as Notification['id'],
  content:
    i % 2 === 0
      ? `Your ride #${100 + i} to the office has been scheduled successfully.`
      : `AI Assistant has suggested a new carpool route that saves you 15 minutes today.`,
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  isDeleted: false,
  creator: {
    firstName: i % 2 === 0 ? 'Human' : 'PickUs',
    lastName: i % 2 === 0 ? `User ${i}` : 'AI',
    role: i % 2 === 0 ? UserRole.BASIC_USER : UserRole.AI,
    profileImageUrl: i % 2 === 0 ? `https://i.pravatar.cc/150?u=user${i}` : undefined,
  } as unknown as Notification['creator'],
}));

export const notificationKeys = {
  all: ['notifications'] as const,
  user: (userId: string) => [...notificationKeys.all, userId] as const,
};

export const useNotifications = (userId?: string) => {
  return useQuery({
    queryKey: notificationKeys.user(userId!),
    queryFn: async () => {
      const data = await getNotifications(userId!);
      return [...MOCK_NOTIFICATIONS, ...data];
    },
    enabled: !!userId,
  });
};
