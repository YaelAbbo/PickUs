import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import type { UUID } from 'crypto';
import { Repository } from 'typeorm';
import { Notification } from '../database/entities/notification.entity';
import { Ride, RideStatus } from '../database/entities/ride.entity';
import { User, UserRole } from '../database/entities/user.entity';

/** Cosine distance threshold: lower = more similar.
 * 0.3 means ~0.7 cosine similarity.
 * */
const COSINE_DISTANCE_THRESHOLD = 0.3;

const MATCH_NOTIFICATION_CONTENT =
  'מצאנו נסיעה חדשה שמתאימה למסלולים הרגילים שלך! לחץ כאן כדי לראות את הפרטים ולהצטרף.';

interface MatchedUserRide {
  userId: UUID;
  rideId: UUID;
}

@Injectable()
export class RideMatchingCronService {
  private readonly logger = new Logger(RideMatchingCronService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleRideMatching(): Promise<void> {
    this.logger.log('Starting ride matching cron job');

    try {
      const aiUser = await this.getAIUser();
      if (!aiUser) {
        this.logger.warn('No AI user found. Skipping ride matching.');
        return;
      }

      const pendingRides = await this.getPendingRidesWithEmbeddings();
      if (pendingRides.length === 0) {
        this.logger.log('No pending rides with embeddings found.');
        return;
      }

      this.logger.log(`Found ${pendingRides.length} pending rides to process.`);

      const matches = await this.findMatchingUsersForRides(pendingRides);
      if (matches.length === 0) {
        this.logger.log('No matching users found for any rides.');
        return;
      }

      this.logger.log(`Found ${matches.length} potential matches.`);

      const newMatches = await this.filterExistingNotifications(matches);
      if (newMatches.length === 0) {
        this.logger.log(
          'All relevant matches already have notifications. Nothing to do.',
        );
        return;
      }

      await this.createNotifications(aiUser.id, newMatches);
      this.logger.log(
        `Ride matching cron job completed. Created ${newMatches.length} notifications.`,
      );
    } catch (error) {
      this.logger.error('Error during ride matching cron job:', error);
    }
  }

  private async getAIUser(): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        role: UserRole.AI,
        isDeleted: false,
      },
    });
  }

  private async getPendingRidesWithEmbeddings(): Promise<Ride[]> {
    return this.rideRepository
      .createQueryBuilder('ride')
      .leftJoin(
        'ride_passenger',
        'rp',
        'rp.ride_id = ride.id AND rp.is_deleted = false',
      )
      .where('ride.rideStatus = :status', { status: RideStatus.PENDING })
      .andWhere('ride.startsAt > NOW()')
      .andWhere('ride.embedding IS NOT NULL')
      .andWhere('ride.isDeleted = false')
      .groupBy('ride.id')
      .having('COUNT(rp.id) < ride.max_seats_amount')
      .getMany();
  }

  private async findMatchingUsersForRides(
    rides: Ride[],
  ): Promise<MatchedUserRide[]> {
    const matches: MatchedUserRide[] = [];

    for (const ride of rides) {
      const matchedUsers = await this.userRepository
        .createQueryBuilder('user')
        .select(['user.id'])
        .where('user.avgRideEmbedding IS NOT NULL')
        .andWhere('user.isDeleted = false')
        .andWhere('user.id != :driverId', { driverId: ride.driverId })
        .andWhere(
          'user.avg_ride_embedding <=> :rideEmbedding < :distanceThreshold',
          {
            rideEmbedding: JSON.stringify(ride.embedding),
            distanceThreshold: COSINE_DISTANCE_THRESHOLD,
          },
        )
        .getMany();

      for (const user of matchedUsers) {
        matches.push({
          userId: user.id,
          rideId: ride.id,
        });
      }
    }

    return matches;
  }

  private async filterExistingNotifications(
    matches: MatchedUserRide[],
  ): Promise<MatchedUserRide[]> {
    if (matches.length === 0) return [];

    const rideIds = [...new Set(matches.map((m) => m.rideId))];
    const userIds = [...new Set(matches.map((m) => m.userId))];

    const existingNotifications = await this.notificationRepository
      .createQueryBuilder('notification')
      .select(['notification.id'])
      .addSelect('notification.recipient_user_id', 'recipientId')
      .addSelect('notification.ride_id', 'rideId')
      .where('notification.isDeleted = false')
      .andWhere('notification.ride_id IN (:...rideIds)', { rideIds })
      .andWhere('notification.recipient_user_id IN (:...userIds)', { userIds })
      .getRawMany();

    const existingPairs = new Set(
      existingNotifications.map(
        (n: { recipientId: string; rideId: string }) =>
          `${n.recipientId}:${n.rideId}`,
      ),
    );

    return matches.filter(
      (match) => !existingPairs.has(`${match.userId}:${match.rideId}`),
    );
  }

  private async createNotifications(
    aiUserId: UUID,
    matches: MatchedUserRide[],
  ): Promise<void> {
    const notifications = matches.map((match) =>
      this.notificationRepository.create({
        creator: { id: aiUserId },
        recipient: { id: match.userId },
        ride: { id: match.rideId },
        content: MATCH_NOTIFICATION_CONTENT,
      }),
    );

    await this.notificationRepository.save(notifications);
  }
}
