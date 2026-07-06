import type { Ride } from '@/schemas/ride';

export const filterAndSortRides = (
  activeTab: 'all' | 'driver' | 'passenger' | 'history',
  driverRides: Ride[],
  passengerRides: Ride[],
  driverHistoryRides: Ride[],
  passengerHistoryRides: Ride[],
): Ride[] => {
  if (activeTab === 'history') {
    return [...driverHistoryRides, ...passengerHistoryRides]
      .filter((ride, index, self) => index === self.findIndex((t) => t.id === ride.id))
      .sort((rideA, rideB) => new Date(rideB.startsAt).getTime() - new Date(rideA.startsAt).getTime());
  }
  if (activeTab === 'driver') {
    return driverRides;
  }
  if (activeTab === 'passenger') {
    return passengerRides;
  }
  return [...driverRides, ...passengerRides]
    .filter((ride, index, self) => index === self.findIndex((t) => t.id === ride.id))
    .sort((rideA, rideB) => new Date(rideA.startsAt).getTime() - new Date(rideB.startsAt).getTime());
};
