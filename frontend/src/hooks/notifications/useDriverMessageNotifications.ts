import type { Notification } from '@/api/notification.api';
import { i18n } from '@/i18n';
import type { DriverMessagePayload } from '@/services/ride/rideService';
import { WsEvent, notificationKeys, useAuth, websocketService } from '@services';
import { IS_WEB } from '@constants';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Alert } from 'react-native';

const handleDriverMessageNotification = ({ content }: DriverMessagePayload) => {
  if (IS_WEB) {
    window.alert(`${i18n.notifications.driver_message_alert_title}\n\n${content}`);
  } else {
    Alert.alert(i18n.notifications.driver_message_alert_title, content, [{ text: i18n.general.accept }]);
  }
};

export const useDriverMessageNotifications = () => {
  const { user } = useAuth();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const handler = (payload: DriverMessagePayload) => {
      console.log('[WS] Received driver message:', payload);
      handleDriverMessageNotification(payload);

      queryClient.setQueryData<Notification[]>(notificationKeys.user(user.id), (prevNotifications = []) => [
        {
          id: `00000000-0000-0000-0000-${Date.now().toString().padStart(12, '0')}` as Notification['id'],
          content: payload.content,
          createdAt: new Date().toISOString(),
          isDeleted: false,
          creator: payload.driver,
        },
        ...prevNotifications,
      ]);
    };

    const unsubscribeFromDriverMessage = websocketService.on(WsEvent.DRIVER_MESSAGE, handler);

    return () => unsubscribeFromDriverMessage();
  }, [user, queryClient]);
};
