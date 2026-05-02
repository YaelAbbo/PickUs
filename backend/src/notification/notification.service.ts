import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, WhereExpressionBuilder } from 'typeorm';
import { Notification } from '../database/entities/notification.entity';
import { type User } from '../database/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const { creatorId, rideId, content } = createNotificationDto;

    const notification = this.notificationRepository.create({
      creator: { id: creatorId },
      ride: rideId ? { id: rideId } : null,
      content,
    });

    return await this.notificationRepository.save(notification);
  }

  async delete(id: Notification['id']): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    notification.isDeleted = true;
    await this.notificationRepository.save(notification);
  }

  async getUserNotifications(userId: User['id']): Promise<Notification[]> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return await this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.creator', 'creator')
      .leftJoinAndSelect('notification.ride', 'ride')
      .leftJoin(
        'ride_passenger',
        'rp',
        'rp.ride_id = ride.id AND rp.user_id = :userId AND rp.is_deleted = false',
        { userId },
      )
      .where('notification.isDeleted = false')
      .andWhere('notification.createdAt >= :yesterday', { yesterday })
      .andWhere(
        new Brackets((qb: WhereExpressionBuilder) => {
          qb.where('ride.id IS NULL').orWhere('ride.isDeleted = false');
        }),
      )
      .andWhere(
        new Brackets((qb: WhereExpressionBuilder) => {
          qb.where('ride.driver_id = :userId', { userId }).orWhere(
            'rp.id IS NOT NULL',
          );
        }),
      )
      .orderBy('notification.createdAt', 'DESC')
      .getMany();
  }
}
