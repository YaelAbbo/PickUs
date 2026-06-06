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

// Matches Israel numbers after stripping spaces/dashes:
// Supports: Local zero (0) or International (+972 / 972)
// Prefixes: 5X (Mobile), 7X (VoIP), or 2, 3, 4, 8, 9 (Landlines) followed by exactly 7 digits.
const israelPhoneRegex = /^(?:\+972|972|0)(5\d|7\d|[23489])\d{7}$/;

export const israelPhoneSchema = z.string().superRefine((val, ctx) => {
  // Strip spaces and dashes exactly once
  const clean = val.replace(/[- ]/g, '');

  const maximum = 17;

  if (clean.length < 9) {
    ctx.addIssue({
      code: 'too_big',
      message: i18n.general.phone_number_too_short,
      maximum,
      origin: 'string',
    });
    return;
  }

  if (clean.length > maximum) {
    ctx.addIssue({
      code: 'too_big',
      message: i18n.general.phone_number_too_long,
      maximum,
      origin: 'string',
    });

    return;
  }

  if (!israelPhoneRegex.test(clean)) {
    ctx.addIssue({
      code: 'invalid_format',
      message: i18n.general.phone_number_non_israeli_format,
      format: 'regex',
    });
  }
});
