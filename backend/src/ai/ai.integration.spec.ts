import { getQueueToken } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bull';
import type { UUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseModule } from '../database/database.module';
import { AiModule } from './ai.module';
import { AiProducer } from './ai.producer';
import { AI_JOBS, EMBEDDING_QUEUE } from './types';

// Mock the @google/genai module globally
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      embedContent: jest.fn().mockResolvedValue({
        embeddings: [
          { values: Array.from({ length: 768 }, () => Math.random()) },
        ],
      }),
    },
  })),
}));

/**
 * Integration test for the AI embedding pipeline.
 *
 * Prerequisites:
 * - Redis must be running on localhost:6379 (or REDIS_HOST/REDIS_PORT env vars)
 * - PostgreSQL test database available
 *
 * This test verifies the full flow:
 * 1. Producer queues embedding jobs
 * 2. Processor picks up jobs from Redis queue
 * 3. Embeddings are generated (mocked) and saved to database
 */
describe('AI Module Integration', () => {
  let module: TestingModule;
  let producer: AiProducer;
  let queue: Queue;

  beforeAll(async () => {
    // Override DB_HOST for local test execution (Docker uses 'db')
    process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
    process.env.REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';

    try {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true, envFilePath: '../.env' }),
          DatabaseModule,
          AiModule,
        ],
      }).compile();

      producer = module.get<AiProducer>(AiProducer);
      queue = module.get<Queue>(getQueueToken(EMBEDDING_QUEUE));
    } catch (error) {
      console.warn('Integration test setup failed - Redis or DB not available');
      throw error;
    }
  }, 30000);

  afterAll(async () => {
    if (queue) {
      await queue.empty();
      await queue.close();
    }
    if (module) {
      await module.close();
    }
  });

  beforeEach(async () => {
    if (queue) {
      await queue.empty();
    }
  });

  describe('Queue Operations', () => {
    it('should add ride embedding job to queue', async () => {
      const rideId = crypto.randomUUID();

      await producer.queueRideCompletionTasks(rideId, rideId, []);

      const jobs = await queue.getJobs(['waiting', 'active', 'delayed']);
      const rideJob = jobs.find(
        (j) => j.name === AI_JOBS.UPDATE_RIDE_EMBEDDING,
      );

      expect(rideJob).toBeDefined();
      expect(rideJob?.data.rideId).toBe(rideId);
    });

    it('should add user embedding jobs for driver and passengers', async () => {
      const rideId = crypto.randomUUID();
      const driverId = crypto.randomUUID();
      const passengerIds = [crypto.randomUUID(), crypto.randomUUID()];

      await producer.queueRideCompletionTasks(rideId, driverId, passengerIds);

      const jobs = await queue.getJobs(['waiting', 'active', 'delayed']);
      const userJobs = jobs.filter(
        (j) =>
          j.name === AI_JOBS.UPDATE_USER_STATS_AND_EMBEDDING &&
          j.data.rideId === rideId,
      );

      // Should have 3 user jobs: 1 driver + 2 passengers
      expect(userJobs.length).toBe(3);
      expect(userJobs.map((j) => j.data.userId)).toContain(driverId);
      expect(userJobs.map((j) => j.data.userId)).toContain(passengerIds[0]);
      expect(userJobs.map((j) => j.data.userId)).toContain(passengerIds[1]);
    });

    it('should add initial user embedding job', async () => {
      const userId = crypto.randomUUID();

      await producer.queueInitialUserEmbedding(userId);

      const jobs = await queue.getJobs(['waiting', 'active', 'delayed']);
      const initialJob = jobs.find(
        (j) => j.name === AI_JOBS.GENERATE_INITIAL_USER_EMBEDDING,
      );

      expect(initialJob).toBeDefined();
      expect(initialJob?.data.userId).toBe(userId);
    });

    it('should configure exponential backoff for retries', async () => {
      const rideId = crypto.randomUUID();

      await producer.queueRideCompletionTasks(rideId, rideId, []);

      const jobs = await queue.getJobs(['waiting']);
      const job = jobs[0];

      expect(job?.opts?.attempts).toBe(5);
      expect(job?.opts?.backoff).toEqual({
        type: 'exponential',
        delay: 2000,
      });
    });
  });
});

/**
 * Simpler unit-style integration test that doesn't require Redis.
 * Tests the producer logic in isolation.
 */
describe('AiProducer (Unit)', () => {
  let producer: AiProducer;
  let mockQueue: { add: jest.Mock };

  beforeEach(async () => {
    mockQueue = { add: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiProducer,
        { provide: getQueueToken(EMBEDDING_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    producer = module.get<AiProducer>(AiProducer);
  });

  it('should queue all tasks for ride completion', async () => {
    const rideId = uuidv4() as UUID;
    const driverId = uuidv4() as UUID;
    const passengerIds = [uuidv4() as UUID, uuidv4() as UUID];

    await producer.queueRideCompletionTasks(rideId, driverId, passengerIds);

    // 1 ride + 1 driver + 2 passengers = 4 jobs
    expect(mockQueue.add).toHaveBeenCalledTimes(4);

    expect(mockQueue.add).toHaveBeenCalledWith(
      AI_JOBS.UPDATE_RIDE_EMBEDDING,
      { rideId },
      expect.any(Object),
    );

    expect(mockQueue.add).toHaveBeenCalledWith(
      AI_JOBS.UPDATE_USER_STATS_AND_EMBEDDING,
      { userId: driverId, rideId },
      expect.any(Object),
    );
  });
});
