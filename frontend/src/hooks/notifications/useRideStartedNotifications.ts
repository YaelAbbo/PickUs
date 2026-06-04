import type { Notification } from '@/api/notification.api';
import { i18n } from '@/i18n';
import type { RideStartedPayload } from '@/services/ride/rideService';
import { WsEvent, notificationKeys, useAuth, websocketService } from '@services';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Alert } from 'react-native';

const handleRideStartedNotification = ({ content }: RideStartedPayload) =>
  Alert.alert(i18n.notifications.ride_started_alert_title, content, [{ text: i18n.general.accept }]);

export const useRideStartedNotifications = () => {
  const { user } = useAuth();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const handler = (payload: RideStartedPayload) => {
      handleRideStartedNotification(payload);

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

    const unsubscribeFromRideStarted = websocketService.on(WsEvent.RIDE_STARTED, handler);

    return () => unsubscribeFromRideStarted();
  }, [user, queryClient]);
};
