import { i18n } from '@/i18n';
import { REQUIRED } from '@constants';
import type { UUID } from 'crypto';
import { z } from 'zod';

export const uuidSchema = z.custom<UUID>().and(z.uuidv4({ error: ({ path }) => `${path} must be a valid UUID` }));

export const entityMetadata = z.object({
  id: uuidSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const dateSchema = z.date(REQUIRED);

export const locationSchema = z.string(REQUIRED).min(3, i18n.general.must_enter_location);

export const longitudeSchema = z.number();
export const latitudeSchema = z.number();

export const coordinatesSchema = z.tuple([longitudeSchema, latitudeSchema]);

export const pointSchema = z.object({ type: z.literal('Point'), coordinates: coordinatesSchema });
