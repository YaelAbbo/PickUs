import { rideQueryUtils } from '@/services/ride/rideQueries';
import { rideService } from '@/services/ride/rideService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteRide = () => {
  const queryClient = useQueryClient();

  const { deleteRide } = rideQueryUtils(queryClient);

  return useMutation({ mutationFn: rideService.deleteRide, onSuccess: deleteRide });
};
