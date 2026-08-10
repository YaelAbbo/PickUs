import type { Ride, User } from '@/database/entities';

export const filterAvailableRides = (rides: Ride[], userId: User['id']) =>
  rides.filter((ride) => {
    const isUserPassenger = ride.passengers.some(
      (ridePassenger) => ridePassenger.userId === userId,
    );

    if (isUserPassenger) return false;

    const passengerCount = ride.passengers?.length || 0;
    const availableSeats = ride.maxSeatsAmount - passengerCount;
    return availableSeats > 0;
  });
