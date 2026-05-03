import { type Ride } from '@/schemas/ride';
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { RideFilters, rideService } from './rideService';

export const RIDES_QUERY_KEYS = {
  all: ['rides'] as const,
  available: (filters?: RideFilters) => [...RIDES_QUERY_KEYS.all, 'available', filters] as const,
  detail: (id: Ride['id']) => [...RIDES_QUERY_KEYS.all, 'detail', id] as const,
};

export const useAvailableRides = (filters?: RideFilters) => {
  return useQuery({
    queryKey: RIDES_QUERY_KEYS.available(filters),
    queryFn: () => rideService.getAvailableRides(filters),
    staleTime: 1000 * 60 * 5,
  });
};

export const useRide = (id: Ride['id']) => {
  return useQuery({
    queryKey: RIDES_QUERY_KEYS.detail(id),
    queryFn: () => rideService.getRideById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

export const rideQueryUtils = (queryClient: QueryClient) => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateRideState: (updatedRide: Ride) => {
    // TODO: Update specific ride, not all rides
    queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.all });
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteRide: (rideId: Ride['id']) => {
    // TODO: Update specific ride, not all rides
    queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.all });
  },
});
