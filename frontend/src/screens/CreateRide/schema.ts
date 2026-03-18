import { dateSchema, locationSchema } from '@/schemas/genericSchemas';
import { z } from 'zod';

const stopSchema = z.object({ time: dateSchema, location: locationSchema });

export const createRideSchema = z
  .object({
    rideDate: dateSchema,
    startTime: dateSchema,
    origin: locationSchema,
    endTime: dateSchema,
    destination: locationSchema,
    seats: z.int().min(1).max(5),
    isReturnTrip: z.boolean(),
    stops: z.array(stopSchema),
  })
  .superRefine(({ stops }, context) => {
    stops.forEach((stop, i) => {
      const isStopAfterLast = i === 0 || stop.time > (stops[i - 1]?.time ?? 0);

      if (!isStopAfterLast)
        context.addIssue({
          code: 'custom',
          path: ['stops', i, 'time'],
          message: 'חייבת להיות אחרי הקודמת',
        });
    });
  });

export type CreateRideFormValues = z.infer<typeof createRideSchema>;
