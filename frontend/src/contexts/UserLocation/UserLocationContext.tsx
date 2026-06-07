import { useCustomContext } from '@/hooks/useCustomContext';
import { i18n } from '@/i18n';
import { SplashScreen } from '@components';
import { createContext, type PropsWithChildren } from 'react';
import { useTrackUserLocation, type UseTrackUserLocationContent } from '../UserLocation/useTrackUserLocation';

export type UserLocationContextValue = Omit<
  UseTrackUserLocationContent,
  'isUserLocationLoading' | 'userLocationErrorMessage'
>;

const UserLocationContext = createContext<UserLocationContextValue | null>(null);

export const UserLocationProvider = ({ children }: PropsWithChildren) => {
  const { isUserLocationLoading, userLocationErrorMessage, ...useTrackUserLocationContent } = useTrackUserLocation();

  if (isUserLocationLoading)
    return (
      <SplashScreen title={i18n.location.loading_title} subtitle={i18n.location.loading_subtitle} withLogo={false} />
    );

  if (userLocationErrorMessage)
    return (
      <SplashScreen
        title={i18n.location.error_title}
        subtitle={userLocationErrorMessage}
        withLogo={false}
        withLoadingDots={false}
      />
    );

  return <UserLocationContext.Provider value={useTrackUserLocationContent}>{children}</UserLocationContext.Provider>;
};

export const useUserLocationContext = () =>
  useCustomContext({ context: UserLocationContext, contextName: 'UserLocationContext' });
