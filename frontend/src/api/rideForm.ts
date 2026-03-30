import type { Ride } from '@/schemas/ride';
import { api } from '@api';
import type { CreateRideDto, UpdateRideDto } from '../components/RideForm/schema';

export const createRide = async (payload: CreateRideDto) => {
  const { data: createdRide } = await api.post<Ride>('/rides', payload);

  return createdRide;
};

export const updateRide = async ({ rideId, ...payload }: UpdateRideDto) => {
  const { data: updatedRide } = await api.patch<Ride>(`/rides/${rideId}`, payload);

  return updatedRide;
};
