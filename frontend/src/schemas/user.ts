import { i18n } from '@/i18n';
import { REQUIRED } from '@constants';
import { isValidIsraeliId } from '@helpers';
import { z } from 'zod';
import { entityMetadata, pointSchema, uuidSchema } from './genericSchemas';

export enum UserRole {
  BASIC_USER = 'BASIC_USER',
  HR_MANAGER = 'HR_MANAGER',
  ADMIN = 'ADMIN',
}

export const userSchema = entityMetadata.extend({
  nationalId: z
    .string()
    .nonempty(REQUIRED)
    .max(9, i18n.hr_popup.validation_national_id_max.replace('{max}', '9'))
    .refine(isValidIsraeliId, i18n.hr_popup.validation_national_id_invalid),
  firstName: z.string().nonempty(REQUIRED),
  lastName: z.string().nonempty(REQUIRED),
  role: z.enum(UserRole, 'User role must be of type UserRole'),
  isTempPassword: z.boolean(),
  profileImageUrl: z.url().nullable(),
  currentLocation: pointSchema.nullable(),
  orgId: uuidSchema,
});

export type User = z.infer<typeof userSchema>;
