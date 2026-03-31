import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';

import { i18n } from '@/i18n';
import { useAvailableRides } from '@/services/ride/rideQueries';
import { useAuth } from '@/services/auth/AuthContext';

export const MAX_SEATS = 4;
export const FILTER_ALL = i18n.available_rides_screen.filter_all;
export const FILTER_START = 'התחלה';
export const FILTER_DEST = 'יעד';
export const FILTERS = [FILTER_ALL, FILTER_START, FILTER_DEST];

export function useAvailableRidesLogic() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);

  const { data: rides, isLoading, isError, refetch } = useAvailableRides();

  const filteredRides = useMemo(() => {
    if (!rides) return [];
    if (!searchQuery.trim()) return rides;

    const searchLower = searchQuery.toLowerCase().trim();

    return rides.filter((ride) => {
      const matchStart = ride.startDest.toLowerCase().includes(searchLower);
      const matchEnd = ride.endDest.toLowerCase().includes(searchLower);

      if (activeFilter === FILTER_START) return matchStart;
      if (activeFilter === FILTER_DEST) return matchEnd;

      return matchStart || matchEnd;
    });
  }, [rides, searchQuery, activeFilter]);

  const handleRidePress = (rideId: string) => {
    router.push({ pathname: '/modal', params: { rideId } });
  };

  return {
    user,
    logout,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    rides: filteredRides,
    isLoading,
    isError,
    refetch,
    handleRidePress,
  };
}
