import type { UUID } from 'crypto';

export const EMBEDDING_QUEUE = 'embedding-queue';

export const AI_JOBS = {
  UPDATE_RIDE_EMBEDDING: 'update-ride-embedding',
  UPDATE_USER_STATS_AND_EMBEDDING: 'update-user-stats-and-embedding',
  GENERATE_INITIAL_USER_EMBEDDING: 'generate-initial-user-embedding',
} as const;

export type AiJobName = (typeof AI_JOBS)[keyof typeof AI_JOBS];

export type RideEmbeddingJobData = {
  rideId: UUID;
};

export type UserStatsAndEmbeddingJobData = {
  userId: UUID;
  rideId: UUID;
};

export type InitialUserEmbeddingJobData = {
  userId: UUID;
};
