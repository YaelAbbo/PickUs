import type { UUID } from 'crypto';
import type { User } from './user';

export interface Organization {
  id: UUID;
  name: string;
  imageUrl?: string;
  admin: User | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
