import type { LocationUpdatePayload } from '@/services/ride/rideService';
import * as Location from 'expo-location';

export const buildLocationPayload = ({
  coords,
  rideId,
}: Pick<LocationUpdatePayload, 'rideId'> & { coords: Location.LocationObjectCoords }): LocationUpdatePayload => ({
  location: { type: 'Point', coordinates: [coords.longitude, coords.latitude] },
  rideId,
});
