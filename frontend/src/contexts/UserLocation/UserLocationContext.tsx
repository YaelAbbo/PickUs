import { useCustomContext } from '@/hooks/useCustomContext';
import { createContext, type PropsWithChildren } from 'react';
import { useTrackUserLocation, type UseTrackUserLocationContent } from '../UserLocation/useTrackUserLocation';

export type UserLocationContextValue = UseTrackUserLocationContent;

const UserLocationContext = createContext<UserLocationContextValue | null>(null);

export const UserLocationProvider = ({ children }: PropsWithChildren) => {
  const useTrackUserLocationContent = useTrackUserLocation();

  return <UserLocationContext.Provider value={useTrackUserLocationContent}>{children}</UserLocationContext.Provider>;
};

export const useUserLocationContext = () =>
  useCustomContext({ context: UserLocationContext, contextName: 'UserLocationContext' });
