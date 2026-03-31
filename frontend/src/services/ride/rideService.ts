import { api } from '@/api/api';

export interface RideStopInfo {
  id: string;
  locationName: string;
  estimatedArrivalAt: string;
  orderIndex: number;
  passengerCount: number;
}

export interface RidePassengerInfo {
  id: string;
  user?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

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
  stops: RideStopInfo[];
  passengers?: RidePassengerInfo[];
}

export type RideFilters = {
  search?: string;
  category?: string;
};

interface RawRideStop {
  id: string;
  locationName: string;
  estimatedArrivalAt: string;
  orderIndex: number;
}

interface RawRidePassenger {
  id: string;
  rideStop?: { id: string };
  user?: { firstName: string; lastName: string; avatar?: string };
}

interface RawRideResponse {
  id: string;
  startsAt: string;
  estimatedEndsAt: string;
  availableSeats?: number;
  maxSeatsAmount: number;
  rideStatus?: string;
  driver?: { id: string; firstName: string; lastName: string; avatar?: string };
  rideStops?: RawRideStop[];
  passengers?: RawRidePassenger[];
}

const mapRideResponse = (data: RawRideResponse): Ride => {
  const safeDate = (dateStr: string | undefined) => {
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const startDate = safeDate(data.startsAt);
  const endDate = safeDate(data.estimatedEndsAt);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const sortedStops = (data.rideStops || []).sort((a, b) => a.orderIndex - b.orderIndex);

  const stops: RideStopInfo[] = sortedStops.map((stop) => {
    const stopPassengers = (data.passengers || []).filter((p) => p.rideStop?.id === stop.id);
    return {
      id: stop.id,
      locationName: stop.locationName,
      estimatedArrivalAt: stop.estimatedArrivalAt ? formatTime(safeDate(stop.estimatedArrivalAt)) : 'לא ידוע',
      orderIndex: stop.orderIndex,
      passengerCount: stopPassengers.length,
    };
  });

  const startDest = stops.length > 0 ? stops[0]?.locationName || 'לא ידוע' : 'לא ידוע';
  const endDest = stops.length > 0 ? stops[stops.length - 1]?.locationName || 'לא ידוע' : 'לא ידוע';

  const mappedPassengers = (data.passengers || []).map((p) => ({
    id: p.id,
    user: p.user
      ? {
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          avatar: p.user.avatar,
        }
      : undefined,
  }));

  return {
    id: data.id,
    date: `${pad(startDate.getDate())}.${pad(startDate.getMonth() + 1)}.${startDate.getFullYear()}`,
    startTime: formatTime(startDate),
    endTime: formatTime(endDate),
    availableSeats: data.availableSeats ?? data.maxSeatsAmount - mappedPassengers.length,
    maxSeatsAmount: data.maxSeatsAmount ?? 4,
    startDest,
    endDest,
    rideStatus: data.rideStatus || 'PENDING',
    driver: data.driver,
    stops,
    passengers: mappedPassengers,
  };
};

export const rideService = {
  getAvailableRides: async (filters?: RideFilters): Promise<Ride[]> => {
    const { data } = await api.get<RawRideResponse[]>('/rides/available', { params: filters });
    return data.map(mapRideResponse);
  },

  getRideById: async (id: string): Promise<Ride> => {
    const { data } = await api.get<RawRideResponse>(`/rides/${id}`);
    return mapRideResponse(data);
  },
};
