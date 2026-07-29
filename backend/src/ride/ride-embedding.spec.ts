import { LiveUpdatesService } from '@/websocket/live-updates.service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { UUID } from 'crypto';
import { Repository, type SelectQueryBuilder } from 'typeorm';
import { AiProducer } from '../ai/ai.producer';
import { Ride, RideStatus } from '../database/entities';
import { MapGateway } from '../map/map.gateway';
import { NotificationService } from '../notification/notification.service';
import { RideService } from './ride.service';

describe('RideService - Embedding Triggers', () => {
  let rideService: RideService;
  let mockAiProducer: {
    queueRideEmbedding: jest.Mock<(rideId: UUID) => Promise<void>>;
    queueRideCompletionTasks: jest.Mock<(rideId: UUID) => Promise<void>>;
  };
  let mockRideRepository: Partial<Repository<Ride>>;
  let queryBuilderMock: {
    innerJoinAndSelect: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    getOne: jest.Mock<() => Promise<Ride | null>>;
  };

  const rideId = crypto.randomUUID() as UUID;
  const orgId = crypto.randomUUID() as UUID;
  const driverId = crypto.randomUUID() as UUID;
  const stopId = crypto.randomUUID() as UUID;

  const mockRide = {
    id: rideId,
    rideStatus: RideStatus.PENDING,
    passengers: [],
    driverId,
    rideStops: [
      { id: stopId, orderIndex: 0 },
      { id: crypto.randomUUID(), orderIndex: 1 },
    ],
  } as unknown as Ride;

  beforeEach(async () => {
    mockAiProducer = {
      queueRideEmbedding: jest
        .fn<(rideId: UUID) => Promise<void>>()
        .mockResolvedValue(undefined),
      queueRideCompletionTasks: jest
        .fn<(rideId: UUID) => Promise<void>>()
        .mockResolvedValue(undefined),
    };

    queryBuilderMock = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn<() => Promise<Ride | null>>().mockResolvedValue(mockRide),
    };

    mockRideRepository = {
      create: jest
        .fn<Repository<Ride>['create']>()
        .mockReturnValue(mockRide) as unknown as Repository<Ride>['create'],
      save: jest
        .fn<Repository<Ride>['save']>()
        .mockResolvedValue(mockRide) as unknown as Repository<Ride>['save'],
      preload: jest
        .fn<Repository<Ride>['preload']>()
        .mockResolvedValue(mockRide),
      createQueryBuilder: jest
        .fn<Repository<Ride>['createQueryBuilder']>()
        .mockReturnValue(
          queryBuilderMock as unknown as SelectQueryBuilder<Ride>,
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RideService,
        { provide: getRepositoryToken(Ride), useValue: mockRideRepository },
        { provide: AiProducer, useValue: mockAiProducer },
        { provide: NotificationService, useValue: {} },
        { provide: MapGateway, useValue: {} },
        { provide: LiveUpdatesService, useValue: {} },
      ],
    }).compile();

    rideService = module.get<RideService>(RideService);
  });

  describe('createRide', () => {
    it('should queue ride embedding on creation', async () => {
      const createDto = {
        organizationId: orgId,
        driverId,
        startsAt: new Date(),
        estimatedEndsAt: new Date(),
        maxSeatsAmount: 4,
        rideStops: [],
      };

      await rideService.createRide(createDto);

      expect(mockAiProducer.queueRideEmbedding).toHaveBeenCalledWith(rideId);
    });
  });

  describe('updateRide - stops update', () => {
    it('should queue embedding when stops are updated for PENDING ride', async () => {
      const pendingRide = {
        ...mockRide,
        rideStatus: RideStatus.PENDING,
      } as unknown as Ride;
      (
        mockRideRepository.preload as jest.Mock<Repository<Ride>['preload']>
      ).mockResolvedValue(pendingRide);
      queryBuilderMock.getOne.mockResolvedValue(pendingRide);

      await rideService.updateRide(rideId, {
        rideStops: [
          {
            id: stopId,
            location: { type: 'Point', coordinates: [34.78, 32.08] },
            locationName: 'Updated Stop',
            estimatedArrivalAt: new Date(),
            orderIndex: 0,
          },
        ],
      });

      expect(mockAiProducer.queueRideEmbedding).toHaveBeenCalledWith(rideId);
    });

    it('should NOT queue embedding when stops are updated for ACTIVE ride', async () => {
      const activeRide = {
        ...mockRide,
        rideStatus: RideStatus.ACTIVE,
      } as unknown as Ride;
      (
        mockRideRepository.preload as jest.Mock<Repository<Ride>['preload']>
      ).mockResolvedValue(activeRide);
      queryBuilderMock.getOne.mockResolvedValue(activeRide);

      await rideService.updateRide(rideId, {
        rideStops: [
          {
            id: stopId,
            location: { type: 'Point', coordinates: [34.78, 32.08] },
            locationName: 'Updated Stop',
            estimatedArrivalAt: new Date(),
            orderIndex: 0,
          },
        ],
      });

      expect(mockAiProducer.queueRideEmbedding).not.toHaveBeenCalled();
    });

    it('should NOT queue embedding when stops are updated for DONE ride', async () => {
      const doneRide = {
        ...mockRide,
        rideStatus: RideStatus.DONE,
        passengers: [],
      } as unknown as Ride;
      (
        mockRideRepository.preload as jest.Mock<Repository<Ride>['preload']>
      ).mockResolvedValue(doneRide);
      queryBuilderMock.getOne.mockResolvedValue(doneRide);

      await rideService.updateRide(rideId, {
        rideStops: [
          {
            id: stopId,
            location: { type: 'Point', coordinates: [34.78, 32.08] },
            locationName: 'Updated Stop',
            estimatedArrivalAt: new Date(),
            orderIndex: 0,
          },
        ],
      });

      expect(mockAiProducer.queueRideEmbedding).not.toHaveBeenCalled();
    });

    it('should NOT queue embedding for PENDING ride when stops are NOT updated', async () => {
      const pendingRide = {
        ...mockRide,
        rideStatus: RideStatus.PENDING,
      } as unknown as Ride;
      (
        mockRideRepository.preload as jest.Mock<Repository<Ride>['preload']>
      ).mockResolvedValue(pendingRide);
      queryBuilderMock.getOne.mockResolvedValue(pendingRide);

      await rideService.updateRide(rideId, {
        maxSeatsAmount: 5, // Update without rideStops
      });

      expect(mockAiProducer.queueRideEmbedding).not.toHaveBeenCalled();
    });
  });
});
