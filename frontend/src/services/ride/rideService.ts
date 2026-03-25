import { api } from '@/api/api';
import { MAX_SEATS } from '@/app/(tabs)/home';

export interface Ride {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  availableSeats: number;
  startDest: string;
  endDest: string;
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

          availableSeats: Math.min(ride.availableSeats, MAX_SEATS),

          startDest: 'נקודת איסוף',
          endDest: 'נקודת הורדה',
        };
      });
    } catch (error) {
      console.error('Failed to fetch actual rides from backend:', error);
      throw error;
    }
  },
};
