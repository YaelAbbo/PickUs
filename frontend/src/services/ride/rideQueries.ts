import { joinRide, leaveRide, updateRideStop } from '@/api/ridePassenger';
import { type Ride } from '@/schemas/ride';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { RideFilters, rideService } from './rideService';

export const RIDES_QUERY_KEYS = {
  all: ['rides'] as const,
  available: (filters?: RideFilters) => [...RIDES_QUERY_KEYS.all, 'available', filters] as const,
  detail: (id: Ride['id']) => [...RIDES_QUERY_KEYS.all, 'detail', id] as const,
  locations: (id: Ride['id']) => [...RIDES_QUERY_KEYS.all, 'locations', id] as const,
};

export const useRideLocations = (rideId: Ride['id']) => {
  return useQuery({
    queryKey: RIDES_QUERY_KEYS.locations(rideId),
    queryFn: () => rideService.getRideLocations(rideId),
    staleTime: Infinity,
  });
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
  updateRideState: () => queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.all }),
  deleteRide: () => queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.all }),
});

export const useDeleteRide = () => {
  const queryClient = useQueryClient();

  const { deleteRide } = rideQueryUtils(queryClient);

  return useMutation({ mutationFn: rideService.deleteRide, onSuccess: deleteRide });
};

export const useJoinRide = (rideId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rideStopId: string) => joinRide(rideId, rideStopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.detail(rideId as Ride['id']) });
    },
  });
};

export const useLeaveRide = (rideId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => leaveRide(rideId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.detail(rideId as Ride['id']) });
      queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.available() });
    },
  });
};

export const useUpdateRideStop = (rideId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, rideStopId }: { userId: string; rideStopId: string }) =>
      updateRideStop(rideId, userId, rideStopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDES_QUERY_KEYS.detail(rideId as Ride['id']) });
    },
  });
};
