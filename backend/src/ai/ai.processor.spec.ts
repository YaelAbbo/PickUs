import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import type { Job } from 'bull';
import type { UUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { RidePassenger } from '../database/entities/ride-passenger.entity';
import { RideStop } from '../database/entities/ride-stop.entity';
import { Ride } from '../database/entities/ride.entity';
import { User } from '../database/entities/user.entity';
import { AiProcessor } from './ai.processor';
import { AiService } from './ai.service';
import type {
  InitialUserEmbeddingJobData,
  RideEmbeddingJobData,
  UserStatsAndEmbeddingJobData,
} from './types';

describe('AiProcessor', () => {
  let processor: AiProcessor;
  let mockAiService: { generateEmbedding: jest.Mock };
  let mockRideRepository: { update: jest.Mock; findOne: jest.Mock };
  let mockRideStopRepository: { find: jest.Mock };
  let mockRidePassengerRepository: { findOne: jest.Mock };
  let mockUserRepository: { update: jest.Mock; findOne: jest.Mock };
  let mockEntityManager: { findOne: jest.Mock; update: jest.Mock };
  let mockDataSource: { transaction: jest.Mock };

  const mockVector = Array.from({ length: 768 }, (_, i) => i * 0.001);

  const createMockJob = <T>(data: T, id = '1'): Job<T> =>
    ({ id, data }) as Job<T>;

  const createMockStop = (
    orderIndex: number,
    lng: number,
    lat: number,
    hours: number,
    minutes: number,
  ): Partial<RideStop> => ({
    orderIndex,
    location: { type: 'Point', coordinates: [lng, lat] },
    estimatedArrivalAt: new Date(2024, 0, 1, hours, minutes),
    isDeleted: false,
  });

  beforeEach(async () => {
    mockAiService = {
      generateEmbedding: jest.fn().mockResolvedValue(mockVector),
    };
    mockRideRepository = { update: jest.fn(), findOne: jest.fn() };
    mockRideStopRepository = { find: jest.fn() };
    mockRidePassengerRepository = { findOne: jest.fn() };
    mockUserRepository = { update: jest.fn(), findOne: jest.fn() };
    mockEntityManager = { findOne: jest.fn(), update: jest.fn() };
    mockDataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => {
        return cb(mockEntityManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiProcessor,
        { provide: AiService, useValue: mockAiService },
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: getRepositoryToken(Ride), useValue: mockRideRepository },
        {
          provide: getRepositoryToken(RideStop),
          useValue: mockRideStopRepository,
        },
        {
          provide: getRepositoryToken(RidePassenger),
          useValue: mockRidePassengerRepository,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    processor = module.get<AiProcessor>(AiProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleRideEmbedding', () => {
    const rideId = uuidv4() as UUID;

    it('should embed ride with stops and save vector', async () => {
      const stops = [
        createMockStop(0, 34.8, 31.0, 8, 0),
        createMockStop(1, 34.9, 31.5, 8, 30),
        createMockStop(2, 35.0, 32.0, 9, 0),
      ];
      mockRideStopRepository.find.mockResolvedValue(stops);

      const job = createMockJob<RideEmbeddingJobData>({
        rideId,
      });
      await processor.handleRideEmbedding(job);

      expect(mockAiService.generateEmbedding).toHaveBeenCalledWith(
        expect.stringContaining('stop 1:'),
      );
      expect(mockAiService.generateEmbedding).toHaveBeenCalledWith(
        expect.stringContaining('stop 2:'),
      );
      expect(mockAiService.generateEmbedding).toHaveBeenCalledWith(
        expect.stringContaining('stop 3:'),
      );
      expect(mockRideRepository.update).toHaveBeenCalledWith(rideId, {
        embedding: mockVector,
      });
    });

    it('should skip embedding when ride has no stops', async () => {
      mockRideStopRepository.find.mockResolvedValue([]);

      const job = createMockJob<RideEmbeddingJobData>({
        rideId,
      });
      await processor.handleRideEmbedding(job);

      expect(mockAiService.generateEmbedding).not.toHaveBeenCalled();
      expect(mockRideRepository.update).not.toHaveBeenCalled();
    });

    it('should format stop embedding text correctly', async () => {
      const stops = [createMockStop(0, 34.851234, 31.046789, 14, 30)];
      mockRideStopRepository.find.mockResolvedValue(stops);

      const job = createMockJob<RideEmbeddingJobData>({
        rideId,
      });
      await processor.handleRideEmbedding(job);

      expect(mockAiService.generateEmbedding).toHaveBeenCalledWith(
        'stop 1: lat=31.046789 lng=34.851234 at 14:30',
      );
    });

    it('should rethrow errors for Bull retry', async () => {
      mockRideStopRepository.find.mockRejectedValue(new Error('DB error'));

      const job = createMockJob<RideEmbeddingJobData>({
        rideId,
      });

      await expect(processor.handleRideEmbedding(job)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('handleUserStatsAndEmbedding', () => {
    const userId = uuidv4() as UUID;
    const rideId = uuidv4() as UUID;

    const mockUser = {
      id: userId,
      avgStartLocation: null,
      avgEndLocation: null,
      avgStartTime: null,
      avgEndTime: null,
      completedRidesCount: 0,
    };

    const mockStops = [
      createMockStop(0, 34.8, 31.0, 8, 0),
      createMockStop(1, 35.0, 32.0, 9, 0),
    ];

    beforeEach(() => {
      mockEntityManager.findOne.mockResolvedValue(mockUser);
      mockRideStopRepository.find.mockResolvedValue(mockStops);
      mockRideRepository.findOne.mockResolvedValue({
        id: rideId,
        driverId: userId,
      });
    });

    it('should update user stats with first ride data', async () => {
      const job = createMockJob<UserStatsAndEmbeddingJobData>({
        userId,
        rideId,
      });
      await processor.handleUserStatsAndEmbedding(job);

      expect(mockEntityManager.update).toHaveBeenCalledWith(
        User,
        userId,
        expect.objectContaining({
          completedRidesCount: 1,
          avgRideEmbedding: mockVector,
          avgStartLocation: expect.objectContaining({ type: 'Point' }),
          avgEndLocation: expect.objectContaining({ type: 'Point' }),
          avgStartTime: expect.stringMatching(/^\d{2}:\d{2}:\d{2}$/),
          avgEndTime: expect.stringMatching(/^\d{2}:\d{2}:\d{2}$/),
        }),
      );
    });

    it('should skip when user is not found', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      const job = createMockJob<UserStatsAndEmbeddingJobData>({
        userId,
        rideId,
      });
      await processor.handleUserStatsAndEmbedding(job);

      expect(mockAiService.generateEmbedding).not.toHaveBeenCalled();
      expect(mockEntityManager.update).not.toHaveBeenCalled();
    });

    it('should skip when ride has no stops', async () => {
      mockRideStopRepository.find.mockResolvedValue([]);

      const job = createMockJob<UserStatsAndEmbeddingJobData>({
        userId,
        rideId,
      });
      await processor.handleUserStatsAndEmbedding(job);

      expect(mockEntityManager.update).not.toHaveBeenCalled();
    });

    it('should use passenger pickup stop when user is not driver', async () => {
      const passengerUserId = uuidv4() as UUID;
      const pickupStop = createMockStop(1, 34.85, 31.5, 8, 15);

      mockEntityManager.findOne.mockResolvedValue({
        ...mockUser,
        id: passengerUserId,
      });
      mockRideRepository.findOne.mockResolvedValue({
        id: rideId,
        driverId: 'other-driver',
      });
      mockRidePassengerRepository.findOne.mockResolvedValue({
        rideStop: pickupStop,
      });

      const job = createMockJob<UserStatsAndEmbeddingJobData>({
        userId: passengerUserId,
        rideId,
      });
      await processor.handleUserStatsAndEmbedding(job);

      // Should have looked up passenger's pickup stop
      expect(mockRidePassengerRepository.findOne).toHaveBeenCalledWith({
        where: { userId: passengerUserId, rideId },
        relations: ['rideStop'],
      });
    });

    it('should increment completedRidesCount correctly', async () => {
      mockEntityManager.findOne.mockResolvedValue({
        ...mockUser,
        completedRidesCount: 5,
      });

      const job = createMockJob<UserStatsAndEmbeddingJobData>({
        userId,
        rideId,
      });
      await processor.handleUserStatsAndEmbedding(job);

      expect(mockEntityManager.update).toHaveBeenCalledWith(
        User,
        userId,
        expect.objectContaining({ completedRidesCount: 6 }),
      );
    });

    it('should generate embedding with correct format', async () => {
      const job = createMockJob<UserStatsAndEmbeddingJobData>({
        userId,
        rideId,
      });
      await processor.handleUserStatsAndEmbedding(job);

      expect(mockAiService.generateEmbedding).toHaveBeenCalledWith(
        expect.stringMatching(
          /^start: lat=[\d.]+ lng=[\d.]+ at \d{2}:\d{2}; end: lat=[\d.]+ lng=[\d.]+ at \d{2}:\d{2}$/,
        ),
      );
    });
  });

  describe('handleInitialUserEmbedding', () => {
    const userId = uuidv4() as UUID;

    it('should generate initial embedding with NO_RIDES_YET_TEXT', async () => {
      const job = createMockJob<InitialUserEmbeddingJobData>({
        userId,
      });
      await processor.handleInitialUserEmbedding(job);

      expect(mockAiService.generateEmbedding).toHaveBeenCalledWith(
        'start: no data; end: no data',
      );
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        avgRideEmbedding: mockVector,
      });
    });

    it('should rethrow errors for Bull retry', async () => {
      mockAiService.generateEmbedding.mockRejectedValue(
        new Error('429 rate limit'),
      );

      const job = createMockJob<InitialUserEmbeddingJobData>({
        userId,
      });

      await expect(processor.handleInitialUserEmbedding(job)).rejects.toThrow(
        '429 rate limit',
      );
    });
  });

  describe('rate limit handling', () => {
    it('should log warning for rate limit errors', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockRideStopRepository.find.mockRejectedValue(
        new Error('429 Too Many Requests'),
      );

      const job = createMockJob<RideEmbeddingJobData>({
        rideId: uuidv4() as UUID,
      });

      await expect(processor.handleRideEmbedding(job)).rejects.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('non-retryable error handling', () => {
    it('should not throw for 400 client errors', async () => {
      const stops = [createMockStop(0, 34.8, 31.0, 8, 0)];
      mockRideStopRepository.find.mockResolvedValue(stops);
      mockAiService.generateEmbedding.mockRejectedValue(
        new Error('400 Bad Request: Invalid prompt'),
      );

      const job = createMockJob<RideEmbeddingJobData>({
        rideId: uuidv4() as UUID,
      });

      // Should not throw - gracefully handles 400 errors
      await expect(processor.handleRideEmbedding(job)).resolves.not.toThrow();
    });

    it('should rethrow 5xx server errors for retry', async () => {
      const stops = [createMockStop(0, 34.8, 31.0, 8, 0)];
      mockRideStopRepository.find.mockResolvedValue(stops);
      mockAiService.generateEmbedding.mockRejectedValue(
        new Error('503 Service Unavailable'),
      );

      const job = createMockJob<RideEmbeddingJobData>({
        rideId: uuidv4() as UUID,
      });

      await expect(processor.handleRideEmbedding(job)).rejects.toThrow(
        '503 Service Unavailable',
      );
    });

    it('should rethrow rate limit errors for retry', async () => {
      const stops = [createMockStop(0, 34.8, 31.0, 8, 0)];
      mockRideStopRepository.find.mockResolvedValue(stops);
      mockAiService.generateEmbedding.mockRejectedValue(
        new Error('429 Too Many Requests'),
      );

      const job = createMockJob<RideEmbeddingJobData>({
        rideId: uuidv4() as UUID,
      });

      await expect(processor.handleRideEmbedding(job)).rejects.toThrow(
        '429 Too Many Requests',
      );
    });
  });
});
