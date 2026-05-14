import { tokenStorage } from '@/api/tokenStorage';
import { websocketService, WsEvent } from '@/services/websocket';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import type { DriverNearStopPayload } from '../ride/rideService';
import { useLoginMutation, useLogoutMutation, useMeQuery } from './authQueries';
import { useValidateAccessToken } from './useValidateAccessToken';

const handleDriverNearStopNotification = ({ driverDistanceFromStop, stopName, driverName }: DriverNearStopPayload) =>
  Alert.alert(
    'Driver is nearby!',
    `${driverName} is ${driverDistanceFromStop}m from your stop '${stopName}'. Get ready!`,
    [{ text: 'OK' }],
  );

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

  useEffect(() => {
    if (user) {
      tokenStorage.getAccessToken().then((token) => {
        if (token) websocketService.connect(token);

        websocketService.on(WsEvent.DRIVER_NEAR_STOP, handleDriverNearStopNotification);
      });
    } else {
      websocketService.disconnect();
    }
  }, [user]);

  return { user, isUserLoading, refreshUser, login, logout };
};
