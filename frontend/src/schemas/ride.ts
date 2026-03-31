import { REQUIRED } from '@constants';
import { z } from 'zod';
import { entityMetadata, uuidSchema } from './genericSchemas';

export enum RideStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export const pointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
});

export const rideStopSchema = entityMetadata.extend({
  location: pointSchema,
  locationName: z.string().nonempty(REQUIRED),
  estimatedArrivalAt: z.coerce.date(),
  orderIndex: z.int().min(0),
});

export const rideSchema = entityMetadata.extend({
  orgId: uuidSchema,
  driverId: uuidSchema,
  startsAt: z.coerce.date(),
  estimatedEndsAt: z.coerce.date(),
  maxSeatsAmount: z.number().positive(),
  rideStatus: z.enum(RideStatus),
  currentLocation: pointSchema.nullable(),
  rideStops: z.array(rideStopSchema),
});

export type Ride = z.infer<typeof rideSchema>;
export type RideStop = z.infer<typeof rideStopSchema>;
