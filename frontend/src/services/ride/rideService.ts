import { api } from '@/api/api';
import { rideEntitySchema, type Ride, type RideStop } from '@/schemas/ride';
import type { Point } from '@types';
import type { UUID } from 'crypto';
import { z } from 'zod';

export type RideEntityType = 'DRIVER' | 'PASSENGER' | 'STOP';

export type RideEntityLocationPayload = { id: UUID; location: Point; rideId?: Ride['id'] };

export type RideEntityLocationPayloadWithDetails = RideEntityLocationPayload & {
  type: RideEntityType;
  name: string;
};

export type LocationUpdatePayload = { location: Point; rideId?: Ride['id'] };

export type DriverNearStopPayload = Pick<RideStop, 'estimatedArrivalAt'> & {
  rideId: Ride['id'];
  stopId: RideStop['id'];
  stopName: RideStop['locationName'];
  driverName: NonNullable<Ride['driver']>['fullName'];
  driverDistanceFromStop: number;
};

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
    const { data: rideLocations } = await api.get<RideEntityLocationPayloadWithDetails[]>(`/rides/${rideId}/locations`);

    return rideLocations;
  },

  deleteRide: (rideId: Ride['id']) => api.delete(`/rides/${rideId}`),
};
