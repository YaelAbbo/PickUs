import type { Ride } from '@/database/entities';

export const filterAvailableRides = (rides: Ride[]) =>
  rides.filter((ride) => {
    const passengerCount = ride.passengers?.length || 0;
    const availableSeats = ride.maxSeatsAmount - passengerCount;
    return availableSeats > 0;
  });
