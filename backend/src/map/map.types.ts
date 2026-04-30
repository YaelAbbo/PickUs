import type { Ride } from '@/database/entities/ride.entity';
import type { User } from '@/database/entities/user.entity';

export type JSONPrimitive = string | number | boolean | null | undefined;

export interface JSONObject {
  [key: string]: JSONPrimitive | JSONObject | JSONPrimitive[] | JSONObject[];
}

export interface GeoJSONGeometry {
  type: string;
  coordinates: number[];
}

export interface LocationUpdatePayload {
  geometry: GeoJSONGeometry;
  properties?: JSONObject;
  rideId?: Ride['id'];
}

export interface LocationUpdatedPayload {
  userId: User['id'];
  geometry: GeoJSONGeometry;
  properties?: JSONObject;
  rideId?: Ride['id'];
}

export interface RoomActionResponse {
  rideId: Ride['id'];
}
