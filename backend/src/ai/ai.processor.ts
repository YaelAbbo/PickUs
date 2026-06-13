import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { first, last, sortBy } from 'lodash';
import { DataSource, Repository } from 'typeorm';
import { RidePassenger } from '../database/entities/ride-passenger.entity';
import { RideStop } from '../database/entities/ride-stop.entity';
import { Ride } from '../database/entities/ride.entity';
import { User } from '../database/entities/user.entity';
import {
  minutesToTimeString,
  rollingAverageCoordinate,
  rollingAverageTime,
  timeToMinutes,
} from '../utils/aggregation.util';
import {
  isClientError,
  isRateLimitError,
  NO_RIDES_YET_TEXT,
} from '../utils/embedding.util';
import { AiService } from './ai.service';
import {
  AI_JOBS,
  EMBEDDING_QUEUE,
  type InitialUserEmbeddingJobData,
  type RideEmbeddingJobData,
  type UserStatsAndEmbeddingJobData,
} from './types';

type LogSeverity = 'log' | 'warn' | 'error';

@Processor(EMBEDDING_QUEUE)
export class AiProcessor {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    private readonly aiService: AiService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
    @InjectRepository(RideStop)
    private readonly rideStopRepository: Repository<RideStop>,
    @InjectRepository(RidePassenger)
    private readonly ridePassengerRepository: Repository<RidePassenger>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private logJob(
    jobId: string | number | undefined,
    message: string,
    severity: LogSeverity = 'log',
  ): void {
    const formatted = `[Job ${jobId}] ${message}`;
    this.logger[severity](formatted);
  }

  /**
   * Formats a Date to "HH:MM" time string.
   */
  private formatTimeFromDate(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  /**
   * Formats a Date to "HH:MM:SS" time string.
   */
  private formatFullTimeFromDate(date: Date): string {
    return date.toTimeString().slice(0, 8);
  }

  private formatUserEmbeddingText(
    startLat: number,
    startLng: number,
    startTime: string,
    endLat: number,
    endLng: number,
    endTime: string,
  ): string {
    return (
      `start: lat=${startLat.toFixed(6)} lng=${startLng.toFixed(6)} at ${startTime}; ` +
      `end: lat=${endLat.toFixed(6)} lng=${endLng.toFixed(6)} at ${endTime}`
    );
  }

  private formatStopToEmbeddingText(index: number, stop: RideStop): string {
    const [lng, lat] = stop.location.coordinates as [number, number];
    const time = this.formatTimeFromDate(stop.estimatedArrivalAt);
    return `stop ${index + 1}: lat=${lat.toFixed(6)} lng=${lng.toFixed(6)} at ${time}`;
  }

  private async saveRideEmbedding(
    rideId: string,
    vector: number[],
  ): Promise<void> {
    await this.rideRepository.update(rideId, {
      embedding: vector,
    });
  }

  private async runWithRateLimitHandling<T>(
    jobId: string | number | undefined,
    fn: () => Promise<T>,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (isRateLimitError(error)) {
        this.logJob(
          jobId,
          'Gemini rate limit hit — Bull will retry with exponential backoff.',
          'warn',
        );
        throw error; // Re-throw for Bull retry
      }

      if (isClientError(error)) {
        // 4xx errors (except 429) should not be retried
        const msg = error instanceof Error ? error.message : String(error);
        this.logJob(jobId, `Non-retryable client error: ${msg}`, 'error');
        return undefined as T; // Fail gracefully without retry
      }

      // For 5xx or unknown errors, log and re-throw for retry
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`[Job ${jobId}] Failed: ${msg}`, stack);
      throw error;
    }
  }

  @Process(AI_JOBS.UPDATE_RIDE_EMBEDDING)
  async handleRideEmbedding(job: Job<RideEmbeddingJobData>): Promise<void> {
    const { rideId } = job.data;
    this.logJob(job.id, `Embedding ride ${rideId}`);

    await this.runWithRateLimitHandling(job.id, async () => {
      const stops = await this.rideStopRepository.find({
        where: { rideId: rideId as RideStop['rideId'], isDeleted: false },
        order: { orderIndex: 'ASC' },
      });

      if (stops.length === 0) {
        this.logJob(
          job.id,
          `Ride ${rideId} has no stops — skipping embedding.`,
          'warn',
        );
        return;
      }

      const embeddingText = stops
        .map((stop, i) => this.formatStopToEmbeddingText(i, stop))
        .join('; ');

      const vector = await this.aiService.generateEmbedding(embeddingText);
      await this.saveRideEmbedding(rideId, vector);

      this.logJob(job.id, `Ride ${rideId} embedding saved.`);
    });
  }

  @Process(AI_JOBS.UPDATE_USER_STATS_AND_EMBEDDING)
  async handleUserStatsAndEmbedding(
    job: Job<UserStatsAndEmbeddingJobData>,
  ): Promise<void> {
    const { userId, rideId } = job.data;
    this.logJob(
      job.id,
      `Updating stats for user ${userId} from ride ${rideId}`,
    );

    await this.runWithRateLimitHandling(job.id, async () => {
      // Use pessimistic write lock to prevent race conditions when
      // multiple rides complete in quick succession
      await this.dataSource.transaction(async (manager) => {
        const user = await manager.findOne(User, {
          where: { id: userId as User['id'], isDeleted: false },
          select: [
            'id',
            'avgStartLocation',
            'avgEndLocation',
            'avgStartTime',
            'avgEndTime',
            'completedRidesCount',
          ],
          lock: { mode: 'pessimistic_write' },
        });

        if (!user) {
          this.logJob(job.id, `User ${userId} not found — skipping.`, 'warn');
          return;
        }

        const stops = await this.rideStopRepository.find({
          where: { rideId: rideId as RideStop['rideId'], isDeleted: false },
          order: { orderIndex: 'ASC' },
        });

        if (stops.length === 0) {
          this.logJob(
            job.id,
            `Ride ${rideId} has no stops — skipping user update.`,
            'warn',
          );
          return;
        }

        const sortedStops = sortBy(stops, 'orderIndex');
        const firstStop = first(sortedStops);
        const lastStop = last(sortedStops);

        if (!firstStop || !lastStop) {
          this.logJob(
            job.id,
            `Ride ${rideId} stops are invalid — skipping.`,
            'warn',
          );
          return;
        }

        const ride = await this.rideRepository.findOne({
          where: { id: rideId as Ride['id'] },
          select: ['id', 'driverId'],
        });

        let userStartStop: RideStop = firstStop;

        if (ride && ride.driverId !== userId) {
          // This user is a passenger — their pickup stop isn't necessarily the first one.
          const passengerRecord = await this.ridePassengerRepository.findOne({
            where: {
              userId: userId as RidePassenger['userId'],
              rideId: rideId as RidePassenger['rideId'],
            },
            relations: ['rideStop'],
          });
          if (passengerRecord?.rideStop) {
            userStartStop = passengerRecord.rideStop;
          }
        }

        const userEndStop: RideStop = lastStop;

        const newCount = (user.completedRidesCount ?? 0) + 1;

        const newAvgStartLocation = rollingAverageCoordinate(
          user.avgStartLocation,
          userStartStop.location,
          newCount,
        );
        const newAvgEndLocation = rollingAverageCoordinate(
          user.avgEndLocation,
          userEndStop.location,
          newCount,
        );

        const startTimeStr = this.formatFullTimeFromDate(
          userStartStop.estimatedArrivalAt,
        );
        const endTimeStr = this.formatFullTimeFromDate(
          userEndStop.estimatedArrivalAt,
        );

        const storedStartMinutes = user.avgStartTime
          ? timeToMinutes(user.avgStartTime)
          : null;
        const storedEndMinutes = user.avgEndTime
          ? timeToMinutes(user.avgEndTime)
          : null;

        const newAvgStartMinutes = rollingAverageTime(
          storedStartMinutes,
          startTimeStr,
          newCount,
        );
        const newAvgEndMinutes = rollingAverageTime(
          storedEndMinutes,
          endTimeStr,
          newCount,
        );

        const [startLng, startLat] = newAvgStartLocation.coordinates as [
          number,
          number,
        ];
        const [endLng, endLat] = newAvgEndLocation.coordinates as [
          number,
          number,
        ];
        const avgStartTimeStr = minutesToTimeString(newAvgStartMinutes).slice(
          0,
          5,
        );
        const avgEndTimeStr = minutesToTimeString(newAvgEndMinutes).slice(0, 5);

        const embeddingText = this.formatUserEmbeddingText(
          startLat,
          startLng,
          avgStartTimeStr,
          endLat,
          endLng,
          avgEndTimeStr,
        );

        const vector = await this.aiService.generateEmbedding(embeddingText);

        await manager.update(User, userId, {
          avgStartLocation: newAvgStartLocation,
          avgEndLocation: newAvgEndLocation,
          avgStartTime: minutesToTimeString(newAvgStartMinutes),
          avgEndTime: minutesToTimeString(newAvgEndMinutes),
          completedRidesCount: newCount,
          avgRideEmbedding: vector,
        });

        this.logJob(
          job.id,
          `User ${userId} stats updated (count: ${newCount}).`,
        );
      });
    });
  }

  @Process(AI_JOBS.GENERATE_INITIAL_USER_EMBEDDING)
  async handleInitialUserEmbedding(
    job: Job<InitialUserEmbeddingJobData>,
  ): Promise<void> {
    const { userId } = job.data;
    this.logJob(job.id, `Generating initial embedding for user ${userId}`);

    await this.runWithRateLimitHandling(job.id, async () => {
      const vector = await this.aiService.generateEmbedding(NO_RIDES_YET_TEXT);

      await this.userRepository.update(userId, {
        avgRideEmbedding: vector,
      });

      this.logJob(job.id, `Initial embedding saved for user ${userId}.`);
    });
  }
}
