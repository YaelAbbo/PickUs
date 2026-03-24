import { api } from '@/api/api';

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

export const rideService = {
  getAvailableRides: async (filters?: RideFilters): Promise<Ride[]> => {
    try {
      const { data } = await api.get<Ride[]>('/rides/available', { params: filters });
      return data;
    } catch {
      console.warn('Returning mock data for work is still in progress.');
      return [
        {
          id: '1',
          date: '25.10.2026',
          startTime: '08:00',
          endTime: '08:45',
          availableSeats: 3,
          startDest: 'תל אביב',
          endDest: 'הרצליה',
        },
        {
          id: '2',
          date: '25.10.2026',
          startTime: '09:30',
          endTime: '10:00',
          availableSeats: 1,
          startDest: 'רמת גן',
          endDest: 'פתח תקווה',
        },
      ];
    }
  },
};
