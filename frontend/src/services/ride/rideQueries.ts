import { useQuery } from '@tanstack/react-query';
import { rideService, RideFilters } from './rideService';

export const RIDES_QUERY_KEYS = {
  all: ['rides'] as const,
  available: (filters?: RideFilters) => [...RIDES_QUERY_KEYS.all, 'available', filters] as const,
};

export const useAvailableRides = (filters?: RideFilters) => {
  return useQuery({
    queryKey: RIDES_QUERY_KEYS.available(filters),
    queryFn: () => rideService.getAvailableRides(filters),
    staleTime: 1000 * 60 * 5,
  });
};
