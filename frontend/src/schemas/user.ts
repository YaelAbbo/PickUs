import { REQUIRED } from '@constants';
import { isValidIsraeliId } from '@helpers';
import { z } from 'zod';
import { entityMetadata, uuidSchema } from './genericSchemas';
import { pointSchema } from './ride';

export enum UserRole {
  BASIC_USER = 'BASIC_USER',
  HR_MANAGER = 'HR_MANAGER',
  ADMIN = 'ADMIN',
  AI = 'AI',
}

export const userSchema = entityMetadata.extend({
  firstName: z.string().nonempty(REQUIRED),
  lastName: z.string().nonempty(REQUIRED),
  nationalId: z
    .string()
    .nonempty(REQUIRED)
    .max(9, { error: ({ maximum }) => `תעודת זהות בעלת ${maximum} ספרות` })
    .refine(isValidIsraeliId, 'תעודת זהות לא תקינה'),
  orgId: uuidSchema,
  role: z.enum(UserRole, 'User role must be of type UserRole'),
  isTempPassword: z.boolean(),
  profileImageUrl: z.url().nullable(),
  currentLocation: pointSchema.nullable(),
});

export type User = z.infer<typeof userSchema>;
