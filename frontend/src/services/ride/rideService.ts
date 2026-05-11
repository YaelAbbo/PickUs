import { api } from '@/api/api';
import { rideEntitySchema, type Ride } from '@/schemas/ride';
import type { Point } from '@types';
import type { UUID } from 'crypto';
import { z } from 'zod';

export type RideEntityType = 'DRIVER' | 'PASSENGER' | 'STOP';

export type RideEntityLocationPayload = {
  type: RideEntityType;
  id: UUID;
  location: Point | null;
  name: string;
  rideId?: Ride['id'];
};

export type NonNullableRideEntityLocationPayload = Omit<RideEntityLocationPayload, 'location'> & {
  location: Point;
};

export type LocationUpdatePayload = { location: Point; rideId?: Ride['id'] };

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

  getRideLocations: async (rideId: Ride['id']) => {
    const { data: rideLocations } = await api.get<RideEntityLocationPayload[]>(`/rides/${rideId}/locations`);

    return rideLocations;
  },
};
