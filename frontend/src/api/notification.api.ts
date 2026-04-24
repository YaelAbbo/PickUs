import type { UUID } from 'crypto';
import { Ride } from '@/schemas/ride';
import { api } from './api';
import { User } from './user';

export type Notification = {
  id: UUID;
  creator: User;
  ride?: Ride;
  content: string;
  createdAt: string;
  isDeleted: boolean;
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(`/notifications/user/${userId}`);
  return response.data;
};
