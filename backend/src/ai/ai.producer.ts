import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import type { UUID } from 'crypto';
import {
  AI_JOBS,
  EMBEDDING_QUEUE,
  type InitialUserEmbeddingJobData,
  type RideEmbeddingJobData,
  type UserStatsAndEmbeddingJobData,
} from './types';

const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: {
    type: 'exponential' as const,
    delay: 2_000,
  },
  removeOnComplete: true,
  removeOnFail: false,
} as const;

@Injectable()
export class AiProducer {
  private readonly logger = new Logger(AiProducer.name);

  constructor(
    @InjectQueue(EMBEDDING_QUEUE) private readonly embeddingQueue: Queue,
  ) {}

  async queueRideCompletionTasks(
    rideId: UUID,
    driverId: UUID,
    passengerIds: UUID[],
  ): Promise<void> {
    this.logger.log(
      `Queueing completion tasks for ride ${rideId} ` +
        `(driver: ${driverId}, ${passengerIds.length} passenger(s))`,
    );

    await this.embeddingQueue.add(
      AI_JOBS.UPDATE_RIDE_EMBEDDING,
      { rideId } satisfies RideEmbeddingJobData,
      DEFAULT_JOB_OPTIONS,
    );

    await this.embeddingQueue.add(
      AI_JOBS.UPDATE_USER_STATS_AND_EMBEDDING,
      { userId: driverId, rideId } satisfies UserStatsAndEmbeddingJobData,
      DEFAULT_JOB_OPTIONS,
    );

    for (const userId of passengerIds) {
      await this.embeddingQueue.add(
        AI_JOBS.UPDATE_USER_STATS_AND_EMBEDDING,
        { userId, rideId } satisfies UserStatsAndEmbeddingJobData,
        DEFAULT_JOB_OPTIONS,
      );
    }
  }

  async queueInitialUserEmbedding(userId: UUID): Promise<void> {
    this.logger.log(`Queueing initial embedding for new user ${userId}`);
    await this.embeddingQueue.add(
      AI_JOBS.GENERATE_INITIAL_USER_EMBEDDING,
      { userId } satisfies InitialUserEmbeddingJobData,
      DEFAULT_JOB_OPTIONS,
    );
  }
}
