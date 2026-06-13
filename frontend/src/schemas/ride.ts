import { i18n } from '@/i18n';
import { REQUIRED } from '@constants';
import { z } from 'zod';
import { entityMetadata, pointSchema, uuidSchema } from './genericSchemas';

export enum RideStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum RideIrrelevantReason {
  RIDE_CANCELLED = 'RIDE_CANCELLED',
  RIDE_COMPLETED = 'RIDE_COMPLETED',
  RIDE_TIME_PASSED = 'RIDE_TIME_PASSED',
  RIDE_FULL = 'RIDE_FULL',
  RIDE_NOT_FOUND = 'RIDE_NOT_FOUND',
  RIDE_ACTIVE = 'RIDE_ACTIVE',
}

export const rideStopSchema = entityMetadata.extend({
  location: pointSchema,
  locationName: z.string().nonempty(REQUIRED),
  estimatedArrivalAt: z.coerce.date(),
  orderIndex: z.number().min(0),
});

const userBasicDtoSchema = z.object({
  id: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  avgRideEmbedding: z.array(z.number()).nullable(),
  profileImageUrl: z.string().nullable().optional(),
  currentLocation: pointSchema.nullable().optional(),
});

export const ridePassengerSchema = z.object({
  id: z.string(),
  rideStop: z.object({ id: z.string() }).optional(),
  user: userBasicDtoSchema.optional(),
});

export const rideDtoSchema = entityMetadata.extend({
  orgId: uuidSchema,
  driverId: uuidSchema,
  startsAt: z.coerce.date().or(z.string()),
  estimatedEndsAt: z.coerce.date().or(z.string()),
  maxSeatsAmount: z.number().positive(),
  availableSeats: z.number().optional(),
  rideStatus: z.enum(RideStatus).optional(),
  currentLocation: pointSchema.nullable().optional(),
  rideStops: z.array(rideStopSchema).optional(),
  driver: userBasicDtoSchema.optional(),
  passengers: z.array(ridePassengerSchema).optional(),
  embedding: z.array(z.number()).nullable(),
});

const safeDate = (val: string | number | Date | null | undefined) => {
  if (!val) return new Date();
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
};

const pad = (n: number) => n.toString().padStart(2, '0');
const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const rideEntitySchema = rideDtoSchema.transform((data) => {
  const startDate = safeDate(data.startsAt);
  const endDate = safeDate(data.estimatedEndsAt);
  const sortedStops = (data.rideStops || []).sort((a, b) => a.orderIndex - b.orderIndex);

  const stops = sortedStops.map((stop) => {
    const stopPassengers = (data.passengers || []).filter((p) => p.rideStop?.id === stop.id);

    return {
      id: stop.id,
      locationName: stop.locationName,
      locationPoint: stop.location,
      estimatedArrivalAt: stop.estimatedArrivalAt
        ? formatTime(safeDate(stop.estimatedArrivalAt))
        : i18n.general.unknown,
      estimatedArrivalAtDate: stop.estimatedArrivalAt,
      orderIndex: stop.orderIndex,
      passengerCount: stopPassengers.length,
    };
  });

  const startDest = stops.length > 0 ? stops[0]?.locationName || i18n.general.unknown : i18n.general.unknown;
  const endDest =
    stops.length > 0 ? stops[stops.length - 1]?.locationName || i18n.general.unknown : i18n.general.unknown;

  const mappedPassengers = (data.passengers || []).map((p) => ({
    id: p.id,
    userId: p.user?.id,
    rideStopId: p.rideStop?.id,
    user: p.user
      ? {
          id: p.user.id,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          fullName: p.user.fullName,
          profileImageUrl: p.user.profileImageUrl,
        }
      : undefined,
  }));

  return {
    id: data.id,
    driverId: data.driverId,
    date: `${pad(startDate.getDate())}.${pad(startDate.getMonth() + 1)}.${startDate.getFullYear()}`,
    startTime: formatTime(startDate),
    endTime: formatTime(endDate),
    availableSeats: data.availableSeats ?? data.maxSeatsAmount - mappedPassengers.length,
    maxSeatsAmount: data.maxSeatsAmount,
    startDest,
    endDest,
    rideStatus: data.rideStatus || RideStatus.PENDING,
    driver: data.driver,
    stops,
    passengers: mappedPassengers,
    organizationId: data.orgId,
    startsAt: data.startsAt,
    estimatedEndsAt: data.estimatedEndsAt,
  };
});

export type RideDto = z.infer<typeof rideDtoSchema>;
export type Ride = z.infer<typeof rideEntitySchema>;
export type RideStop = z.infer<typeof rideStopSchema>;
