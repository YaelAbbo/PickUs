import { api } from '@/api/api';

export interface Ride {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  availableSeats: number;
  maxSeatsAmount?: number;
  startDest: string;
  endDest: string;
  rideStatus?: string;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  passengers?: string[];
}

export type RideFilters = {
  search?: string;
  category?: string;
};
export type RideResponse = {
  id: string;
  startsAt: string;
  estimatedEndsAt: string;
  availableSeats: number;
};

export const rideService = {
  getAvailableRides: async (filters?: RideFilters): Promise<Ride[]> => {
    try {
      const { data } = await api.get<RideResponse[]>('/rides/available', { params: filters });

      return data.map((ride: RideResponse) => {
        const startDate = new Date(ride.startsAt);
        const endDate = new Date(ride.estimatedEndsAt);
        const pad = (n: number) => n.toString().padStart(2, '0');

        return {
          id: ride.id,
          date: `${pad(startDate.getDate())}.${pad(startDate.getMonth() + 1)}.${startDate.getFullYear()}`,
          startTime: `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`,
          endTime: `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`,
          availableSeats: Math.min(ride.availableSeats, 4),
          // maxSeatsAmount: ride.maxSeatsAmount,
          startDest: 'נקודת איסוף',
          endDest: 'נקודת הורדה',
          // rideStatus: ride.rideStatus,
          // driver: ride.driver,
          // passengers: ride.passengers,
        };
      });
    } catch (error) {
      console.error('Failed to fetch actual rides from backend:', error);
      throw error;
    }
  },

  getRideById: async (id: string): Promise<Ride> => {
    try {
      const { data } = await api.get<RideResponse>(`/rides/${id}`);

      const startDate = new Date(data.startsAt);
      const endDate = new Date(data.estimatedEndsAt);
      const pad = (n: number) => n.toString().padStart(2, '0');

      return {
        id: data.id,
        date: `${pad(startDate.getDate())}.${pad(startDate.getMonth() + 1)}.${startDate.getFullYear()}`,
        startTime: `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`,
        endTime: `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`,
        // availableSeats: data.availableSeats ?? data.maxSeatsAmount ?? 4,
        // maxSeatsAmount: data.maxSeatsAmount ?? 4,
        startDest: 'נקודת איסוף',
        endDest: 'נקודת הורדה',
        // rideStatus: data.rideStatus || 'PENDING',
        // driver: data.driver,
        // passengers: data.passengers || [],
      };
    } catch (error) {
      console.error(`Failed to fetch ride ${id} from backend:`, error);
      throw error;
    }
  },
};
