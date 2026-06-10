import { api } from '@/api/api';
import type { Notification } from '@/api/notification.api';
import type { User } from '@/api/user';
import { rideEntitySchema, type Ride, type RideStop } from '@/schemas/ride';
import type { Point } from '@types';
import type { UUID } from 'crypto';
import { z } from 'zod';

export type { Ride };
export type RideStopInfo = Ride['stops'][number];

export enum RideEntityType {
  DRIVER = 'DRIVER',
  PASSENGER = 'PASSENGER',
  STOP = 'STOP',
}

export type RideEntityLocationPayload = { id: UUID; location: Point; rideId?: Ride['id'] };

export type RideEntityLocationPayloadWithDetails = RideEntityLocationPayload & {
  type: RideEntityType;
  name: string;
};

export type LocationUpdatePayload = { location: Point; rideId?: Ride['id'] };

export type DriverNearStopPayload = Pick<RideStop, 'estimatedArrivalAt'> &
  Pick<Notification, 'content'> & {
    rideId: Ride['id'];
    stopId: RideStop['id'];
    stopName: RideStop['locationName'];
    driverDistanceFromStop: number;
    driver: User;
  };

export type RideStartedPayload = {
  content: string;
  driver: User;
  rideId: Ride['id'];
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

  getRidesByDriverId: async (driverId: string): Promise<Ride[]> => {
    const { data } = await api.get(`/rides/driver/${driverId}`);

    return z.array(rideEntitySchema).parse(data);
  },

  getRidesByPassengerId: async (passengerId: string): Promise<Ride[]> => {
    const { data } = await api.get(`/rides/passenger/${passengerId}`);

    return z.array(rideEntitySchema).parse(data);
  },

  getActiveRideByPassengerId: async (): Promise<Ride | null> => {
    const { data } = await api.get(`/rides/active-ride`);

    if (!data) return null;

    return rideEntitySchema.parse(data);
  },

  validateRideRelevance: async (rideId: string): Promise<{ isRelevant: boolean; reason?: string }> => {
    const { data } = await api.get<{ isRelevant: boolean; reason?: string }>(`/rides/${rideId}/validate`);

    return data;
  },

  updateRide: async (id: string, payload: Partial<Ride>): Promise<Ride> => {
    const { data } = await api.patch(`/rides/${id}`, payload);

    return rideEntitySchema.parse(data);
  },
};
