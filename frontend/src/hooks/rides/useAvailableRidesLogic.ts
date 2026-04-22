import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';

import { i18n } from '@/i18n';
import { useAuth } from '@/services/auth/AuthContext';
import { useAvailableRides } from '@/services/ride/rideQueries';
import type { Ride } from '@/schemas/ride';

export const MAX_SEATS = 4;
export const FILTER_ALL = i18n.available_rides_screen.filter_all;
export const FILTER_START = i18n.rideForm.start;
export const FILTER_DEST = i18n.rideForm.destination;
export const FILTERS = [FILTER_ALL, FILTER_START, FILTER_DEST];

function matchesRideFilter(ride: Ride, searchQuery: string, activeFilter: string): boolean {
  const searchLower = searchQuery.toLowerCase().trim();

  const matchesStart = ride.startDest.toLowerCase().includes(searchLower);
  const matchesDest = ride.endDest.toLowerCase().includes(searchLower);

  switch (activeFilter) {
    case FILTER_START:
      return matchesStart;
    case FILTER_DEST:
      return matchesDest;
    case FILTER_ALL:
      return matchesStart || matchesDest;
    default:
      return true;
  }
}

export function useAvailableRidesLogic() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);

  const { data: rides, isLoading, isError, refetch } = useAvailableRides({ orgId: user?.orgId });

  const filteredRides = useMemo(() => {
    const trimmedQuery = searchQuery.trim();

    if (!rides) return [];

    if (!trimmedQuery) return rides;

    return rides.filter((ride) => matchesRideFilter(ride, trimmedQuery, activeFilter));
  }, [rides, searchQuery, activeFilter]);

  const handleRidePress = (rideId: string) => {
    const destination: Href = {
      pathname: '/rideDetailModal',
      params: { rideId },
    };

    router.push(destination);
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
