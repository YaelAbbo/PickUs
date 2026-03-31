import type { UUID } from 'crypto';
import { z } from 'zod';

export const uuidSchema = z.custom<UUID>().and(z.uuidv4({ error: ({ path }) => `${path} must be a valid UUID` }));

export const entityMetadata = z.object({
  id: uuidSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
