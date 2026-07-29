import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { UUID } from 'crypto';
import { Repository } from 'typeorm';
import { AiProducer } from '../ai/ai.producer';
import { Ride, RideStatus } from '../database/entities';
import { MapGateway } from '../map/map.gateway';
import { NotificationService } from '../notification/notification.service';
import { RideService } from './ride.service';

describe('RideService - Embedding Triggers', () => {
  let rideService: RideService;
  let mockAiProducer: {
    queueRideEmbedding: jest.Mock;
    queueRideCompletionTasks: jest.Mock;
  };
  let mockRideRepository: Partial<Repository<Ride>>;

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
      queueRideEmbedding: jest.fn().mockResolvedValue(undefined),
      queueRideCompletionTasks: jest.fn().mockResolvedValue(undefined),
    };

    mockRideRepository = {
      create: jest.fn().mockReturnValue(mockRide),
      save: jest.fn().mockResolvedValue(mockRide),
      preload: jest.fn().mockResolvedValue(mockRide),
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockRide),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RideService,
        { provide: getRepositoryToken(Ride), useValue: mockRideRepository },
        { provide: AiProducer, useValue: mockAiProducer },
        { provide: NotificationService, useValue: {} },
        { provide: MapGateway, useValue: {} },
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
      const pendingRide = { ...mockRide, rideStatus: RideStatus.PENDING };
      (mockRideRepository.preload as jest.Mock).mockResolvedValue(pendingRide);
      (
        mockRideRepository.createQueryBuilder as jest.Mock
      )().getOne.mockResolvedValue(pendingRide);

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
      const activeRide = { ...mockRide, rideStatus: RideStatus.ACTIVE };
      (mockRideRepository.preload as jest.Mock).mockResolvedValue(activeRide);
      (
        mockRideRepository.createQueryBuilder as jest.Mock
      )().getOne.mockResolvedValue(activeRide);

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
      };
      (mockRideRepository.preload as jest.Mock).mockResolvedValue(doneRide);
      (
        mockRideRepository.createQueryBuilder as jest.Mock
      )().getOne.mockResolvedValue(doneRide);

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
      const pendingRide = { ...mockRide, rideStatus: RideStatus.PENDING };
      (mockRideRepository.preload as jest.Mock).mockResolvedValue(pendingRide);
      (
        mockRideRepository.createQueryBuilder as jest.Mock
      )().getOne.mockResolvedValue(pendingRide);

      await rideService.updateRide(rideId, {
        maxSeatsAmount: 5, // Update without rideStops
      });

      expect(mockAiProducer.queueRideEmbedding).not.toHaveBeenCalled();
    });
  });
});
