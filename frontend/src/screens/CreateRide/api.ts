import type { Ride } from '@/schemas/ride';
import { api } from '@api';
import type { CreateRideDto } from './schema';

export const postCreateRide = async (payload: CreateRideDto) => {
  const { data: createdRide } = await api.post<Ride>('/rides', payload);

  return createdRide;
};
