import { z } from 'zod';

const stopSchema = z.object({
  time: z
    .string()
    .min(1, 'שדה חובה')
    .regex(/^\d{2}:\d{2}$/, 'פורמט שעה לא תקין'),
  location: z.string().min(2, 'שדה חובה'),
});

export const createRideSchema = z.object({
  rideDate: z.string().min(1, 'יש לבחור תאריך'),
  startTime: z
    .string()
    .min(1, 'שדה חובה')
    .regex(/^\d{2}:\d{2}$/, 'פורמט שעה לא תקין'),
  origin: z.string().min(2, 'יש להזין מוצא'),
  endTime: z
    .string()
    .min(1, 'שדה חובה')
    .regex(/^\d{2}:\d{2}$/, 'פורמט שעה לא תקין'),
  destination: z.string().min(2, 'יש להזין יעד'),
  seats: z.number().int().min(1).max(5),
  isReturnTrip: z.boolean(),
  stops: z.array(stopSchema),
});

export type CreateRideFormValues = z.infer<typeof createRideSchema>;
export type StopFormValues = z.infer<typeof stopSchema>;
