import { PickType } from '@nestjs/mapped-types';
import { CreateNotificationDto } from './create-notification.dto';

export class UpdateNotificationDto extends PickType(CreateNotificationDto, [
  'content',
]) {}
