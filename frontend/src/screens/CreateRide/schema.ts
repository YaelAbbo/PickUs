import { uuidSchema } from '@/schemas/genericSchemas';
import { rideSchema, rideStopSchema } from '@/schemas/ride';
import { REQUIRED } from '@constants';
import { z } from 'zod';

const longitude = z.number();
const latitude = z.number();

export const pointSchema = z.object({ type: z.literal('Point'), coordinates: z.tuple([longitude, latitude]) });

export const stopSchema = z.object({
  locationName: z.string().nonempty('יש להזין מיקום'),
  locationPoint: pointSchema,
  time: z.date(REQUIRED),
});

export const createRideSchema = z.object({
  rideDate: z.date(),
  stops: z
    .array(stopSchema)
    .min(2, 'יש להזין נקודת התחלה וסיום')
    .superRefine((stops, ctx) => {
      for (let i = 1; i < stops.length; i++) {
        const currentStop = stops[i];
        const previousStop = stops[i - 1];

        if (!currentStop || !previousStop) continue;

        if (currentStop.time <= previousStop.time)
          ctx.addIssue({ code: 'custom', message: 'חייבת להיות אחרי הקודמת', path: [i, 'time'] });
      }
    }),
  seats: z.int().min(1),
  isReturnTrip: z.boolean(),
  orgId: uuidSchema,
  driverId: uuidSchema,
});

export type CreateRideFormValues = z.infer<typeof createRideSchema>;

export const createRideStopDtoSchema = rideStopSchema.pick({
  location: true,
  locationName: true,
  estimatedArrivalAt: true,
  orderIndex: true,
});

export const createRideDtoSchema = rideSchema
  .pick({ driverId: true, orgId: true, startsAt: true, estimatedEndsAt: true, maxSeatsAmount: true })
  .extend({ rideStops: z.array(createRideStopDtoSchema) });

export type CreateRideStopDto = z.infer<typeof createRideStopDtoSchema>;
export type CreateRideDto = z.infer<typeof createRideDtoSchema>;
