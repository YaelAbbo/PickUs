import type { Notification } from '@/api/notification.api';
import { i18n } from '@/i18n';
import type { DriverNearStopPayload } from '@/services/ride/rideService';
import { WsEvent, notificationKeys, useAuth, websocketService } from '@services';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Alert } from 'react-native';

const handleDriverNearStopNotification = ({ content }: DriverNearStopPayload) =>
  Alert.alert('Driver is nearby!', content, [{ text: i18n.general.accept }]);

export const useDriverNearStopNotifications = () => {
  const { user } = useAuth();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const handler = (payload: DriverNearStopPayload) => {
      handleDriverNearStopNotification(payload);

      queryClient.setQueryData<Notification[]>(notificationKeys.user(user.id), (prevNotifications = []) => [
        {
          id: crypto.randomUUID(),
          content: payload.content,
          createdAt: new Date().toISOString(),
          isDeleted: false,
          creator: payload.driver,
        },
        ...prevNotifications,
      ]);
    };

    const unsubscribeFromDriverNearStop = websocketService.on(WsEvent.DRIVER_NEAR_STOP, handler);

    return () => unsubscribeFromDriverNearStop();
  }, [user, queryClient]);
};
