import { api } from '@api';

export const joinRide = async (rideId: string, rideStopId: string): Promise<void> => {
  await api.post(`/rides/${rideId}/passengers`, { rideStopId });
};

export const leaveRide = async (rideId: string, userId: string): Promise<void> => {
  await api.delete(`/rides/${rideId}/passengers/${userId}`);
};

export const updateRideStop = async (rideId: string, userId: string, rideStopId: string): Promise<void> => {
  await api.patch(`/rides/${rideId}/passengers/${userId}`, { rideStopId });
};
