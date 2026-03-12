import { z } from 'zod';
import { entityMetadata } from './constants';

export enum UserRole {
  BASIC_USER = 'BASIC_USER',
  HR_MANAGER = 'HR_MANAGER',
  ADMIN = 'ADMIN',
  AI = 'AI',
}

export const userSchema = entityMetadata.extend({
  nationalId: z.string().nonempty('User first name is required').max(9, 'User national id must be maximum 9 digits'),
  firstName: z.string().min(1, 'User first name is required'),
  lastName: z.string().min(1, 'User last name is required'),
  role: z.enum(UserRole, 'User role must be of type UserRole'),
  isTempPassword: z.boolean(),
  profileImageUrl: z.url().nullable(),
  currentLocation: z.string().nonempty(),
});

export type User = z.infer<typeof userSchema>;
