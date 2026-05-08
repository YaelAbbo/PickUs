import type { Ride } from '@/database/entities/ride.entity';
import type { UUID } from 'crypto';
import type { Point } from 'geojson';

export type JSONPrimitive = string | number | boolean | null | undefined;

export interface JSONObject {
  [key: string]: JSONPrimitive | JSONObject | JSONPrimitive[] | JSONObject[];
}

export interface LocationUpdatePayload {
  location: Point;
  properties?: JSONObject;
  rideId?: Ride['id'];
}

export type RideEntityLocationPayload = {
  type: 'DRIVER' | 'PASSENGER' | 'STOP';
  id: UUID;
  location: Point | null;
  name: string;
  properties?: JSONObject;
  rideId?: Ride['id'];
};

export interface RoomActionResponse {
  rideId: Ride['id'];
}
