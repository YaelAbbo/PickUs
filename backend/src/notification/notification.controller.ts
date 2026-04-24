import { UseAccessAuth } from '@/auth/decorators';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Notification } from '../database/entities';
import type { User } from '../database/entities';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseAccessAuth()
  @Post()
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    return await this.notificationService.create(createNotificationDto);
  }

  @UseAccessAuth()
  @Get('user/:userId')
  async getUserNotifications(
    @Param('userId') userId: User['id'],
  ): Promise<Notification[]> {
    return await this.notificationService.getUserNotifications(userId);
  }

  @UseAccessAuth()
  @Delete(':id')
  async remove(@Param('id') id: Notification['id']): Promise<void> {
    await this.notificationService.remove(id);
  }
}
