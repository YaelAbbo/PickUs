import { i18n } from '@/i18n';
import { dateSchema, pointSchema, uuidSchema } from '@/schemas/genericSchemas';
import { rideDtoSchema, rideStopSchema, type Ride } from '@/schemas/ride';
import { z } from 'zod';

export const stopSchema = z.object({
  locationName: rideStopSchema.shape.locationName,
  locationPoint: pointSchema,
  time: dateSchema,
});

const rideStopsSchema = z
  .array(stopSchema)
  .min(2, i18n.rideForm.enter_start_and_end_ride_stops)
  .superRefine((stops, ctx) => {
    for (let i = 1; i < stops.length; i++) {
      const currentStop = stops[i];
      const previousStop = stops[i - 1];

      if (!currentStop || !previousStop) continue;

      if (currentStop.time <= previousStop.time)
        ctx.addIssue({ code: 'custom', message: i18n.rideForm.must_be_after_the_prev, path: [i, 'time'] });
    }
  });

export const rideFormSchema = rideDtoSchema.pick({ driverId: true }).extend({
  id: uuidSchema.optional(),
  organizationId: uuidSchema,
  rideDate: dateSchema,
  seats: rideDtoSchema.shape.maxSeatsAmount,
  isReturnTrip: z.boolean(),
  stops: rideStopsSchema,
});

export type RideFormValues = z.infer<typeof rideFormSchema>;

export const rideStopDtoSchema = rideStopSchema.pick({
  location: true,
  locationName: true,
  estimatedArrivalAt: true,
  orderIndex: true,
});

export const createRideDtoSchema = rideDtoSchema
  .pick({ driverId: true, startsAt: true, estimatedEndsAt: true, maxSeatsAmount: true })
  .extend({ organizationId: uuidSchema, rideStops: z.array(rideStopDtoSchema) });

export type RideStopDto = z.infer<typeof rideStopDtoSchema>;
export type CreateRideDto = z.infer<typeof createRideDtoSchema>;

export type UpdateRideDto = Partial<CreateRideDto> & { rideId: Ride['id'] };
