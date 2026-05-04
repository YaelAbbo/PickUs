import { api } from '@/api/api';
import { rideEntitySchema, type Ride } from '@/schemas/ride';
import { z } from 'zod';

export type RideFilters = {
  search?: string;
  category?: string;
  orgId?: string;
};

export const rideService = {
  getAvailableRides: async (filters?: RideFilters): Promise<Ride[]> => {
    const { data } = await api.get('/rides/available', { params: filters });

    return z.array(rideEntitySchema).parse(data);
  },

  getRideById: async (id: string): Promise<Ride> => {
    const { data } = await api.get(`/rides/${id}`);

    return rideEntitySchema.parse(data);
  },

  deleteRide: (rideId: Ride['id']) => api.delete(`/rides/${rideId}`),
};
