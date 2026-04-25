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
  rideId?: string;
}

export interface LocationUpdatedPayload {
  userId: string;
  geometry: GeoJSONGeometry;
  properties?: JSONObject;
  rideId?: string;
}
