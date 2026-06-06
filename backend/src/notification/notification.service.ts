import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, WhereExpressionBuilder } from 'typeorm';
import { Notification } from '../database/entities/notification.entity';
import { type User } from '../database/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import type { UpdateNotificationDto } from './dto/update-notification.dto';

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
    const { creatorId, recipientId, rideId, content } = createNotificationDto;

    const notification = this.notificationRepository.create({
      creator: { id: creatorId },
      recipient: { id: recipientId },
      ride: rideId ? { id: rideId } : null,
      content,
    });

    return await this.notificationRepository.save(notification);
  }

  async createBulk(
    createNotificationDtos: CreateNotificationDto[],
  ): Promise<void> {
    await this.notificationRepository.manager.transaction(async (manager) => {
      const notifications = createNotificationDtos.map((dto) =>
        manager.create(Notification, {
          creator: { id: dto.creatorId },
          recipient: { id: dto.recipientId },
          ride: dto.rideId ? { id: dto.rideId } : null,
          content: dto.content,
        }),
      );

      await manager.save(notifications);
    });
  }

  update = (
    notificationId: Notification['id'],
    updateNotificationDto: UpdateNotificationDto,
  ) =>
    this.notificationRepository.update(notificationId, updateNotificationDto);

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
      .andWhere('creator.id != :userId', { userId })
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

  async getExistingRecipientRidePairs(
    rideIds: string[],
    userIds: string[],
  ): Promise<Set<string>> {
    if (rideIds.length === 0 || userIds.length === 0) {
      return new Set();
    }

    const existingNotifications = await this.notificationRepository
      .createQueryBuilder('notification')
      .select(['notification.id'])
      .addSelect('notification.recipient_user_id', 'recipientId')
      .addSelect('notification.ride_id', 'rideId')
      .where('notification.isDeleted = false')
      .andWhere('notification.ride_id IN (:...rideIds)', { rideIds })
      .andWhere('notification.recipient_user_id IN (:...userIds)', { userIds })
      .getRawMany();

    return new Set(
      existingNotifications.map(
        (notification: { recipientId: string; rideId: string }) =>
          `${notification.recipientId}:${notification.rideId}`,
      ),
    );
  }
}
