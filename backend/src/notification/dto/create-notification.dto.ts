import type { Notification, Ride, User } from '../../database/entities';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  creatorId: User['id'];

  @IsUUID()
  @IsOptional()
  rideId?: Ride['id'];

  @IsString()
  @IsNotEmpty()
  content: Notification['content'];
}
