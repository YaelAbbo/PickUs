import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import type { UUID } from 'crypto';
import { Repository } from 'typeorm';
import { Notification } from '../database/entities/notification.entity';
import { Ride, RideStatus } from '../database/entities/ride.entity';
import { User, UserRole } from '../database/entities/user.entity';

/** Default cosine distance threshold: lower = more similar.
 * 0.3 means ~0.7 cosine similarity.
 */
const DEFAULT_COSINE_DISTANCE_THRESHOLD = 0.3;

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
    private readonly configService: ConfigService,
  ) {}

  private get cosineDistanceThreshold(): number {
    return this.configService.get<number>(
      'COSINE_DISTANCE_THRESHOLD',
      DEFAULT_COSINE_DISTANCE_THRESHOLD,
    );
  }

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
    if (rides.length === 0) return [];

    const rideIds = rides.map((ride) => ride.id);
    const rideEmbeddings = rides.map((ride) => JSON.stringify(ride.embedding));
    const rideDriverIds = rides.map((ride) => ride.driverId);
    const rideOrgIds = rides.map((ride) => ride.orgId);

    // Uses LATERAL JOIN for efficient per-ride user matching with index support
    // Filters: User has an embedding, is not deleted, is not the driver,
    // belongs to same org, is not already a passenger, and has cosine distance below threshold.
    const matches = await this.userRepository.query<MatchedUserRide[]>(
      `
      SELECT u.id AS "userId", r.ride_id AS "rideId"
      FROM (
        SELECT 
          unnest($1::uuid[]) AS ride_id,
          unnest($2::vector[]) AS embedding,
          unnest($3::uuid[]) AS driver_id,
          unnest($4::uuid[]) AS org_id
      ) r
      CROSS JOIN LATERAL (
        SELECT id FROM "user" u
        WHERE u.avg_ride_embedding IS NOT NULL
          AND u.is_deleted = false
          AND u.id != r.driver_id
          AND u.org_id = r.org_id
          AND NOT EXISTS (
            SELECT 1 FROM ride_passenger rp
            WHERE rp.user_id = u.id
              AND rp.ride_id = r.ride_id
              AND rp.is_deleted = false
          )
          AND u.avg_ride_embedding <=> r.embedding < $5
      ) u
      `,
      [
        rideIds,
        rideEmbeddings,
        rideDriverIds,
        rideOrgIds,
        this.cosineDistanceThreshold,
      ],
    );

    return matches;
  }

  private async filterExistingNotifications(
    matches: MatchedUserRide[],
  ): Promise<MatchedUserRide[]> {
    if (matches.length === 0) return [];

    const rideIds = [...new Set(matches.map((match) => match.rideId))];
    const userIds = [...new Set(matches.map((match) => match.userId))];

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
        (notification: { recipientId: string; rideId: string }) =>
          `${notification.recipientId}:${notification.rideId}`,
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
    await this.notificationRepository.manager.transaction(async (manager) => {
      const notifications = matches.map((match) =>
        manager.create(Notification, {
          creator: { id: aiUserId },
          recipient: { id: match.userId },
          ride: { id: match.rideId },
          content: MATCH_NOTIFICATION_CONTENT,
        }),
      );

      await manager.save(notifications);
    });
  }
}
