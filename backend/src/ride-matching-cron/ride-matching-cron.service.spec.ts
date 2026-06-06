import { createTestApp } from '@/test/createTestApp';
import { INestApplication } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Notification,
  Organization,
  Ride,
  RidePassenger,
  RideStatus,
  RideStop,
  User,
  UserRole,
} from '../database/entities';
import { RideMatchingCronModule } from './ride-matching-cron.module';
import { RideMatchingCronService } from './ride-matching-cron.service';

describe('RideMatchingCronService', () => {
  let app: INestApplication;
  let service: RideMatchingCronService;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let rideRepository: Repository<Ride>;
  let rideStopRepository: Repository<RideStop>;
  let ridePassengerRepository: Repository<RidePassenger>;
  let notificationRepository: Repository<Notification>;
  let organizationRepository: Repository<Organization>;

  let testOrgId: Organization['id'] | null = null;
  let aiUserId: User['id'] | null = null;
  let driverUserId: User['id'] | null = null;
  let matchingUserId: User['id'] | null = null;
  let nonMatchingUserId: User['id'] | null = null;

  const createTestEmbedding = (baseValue: number): number[] => {
    return Array(768)
      .fill(0)
      .map((_, i) => baseValue + Math.sin(i * 0.01) * 0.1);
  };

  const similarEmbedding1 = createTestEmbedding(0.5);
  const similarEmbedding2 = createTestEmbedding(0.52);
  const dissimilarEmbedding = createTestEmbedding(-0.5);

  const aiUser = {
    firstName: 'AI',
    lastName: 'Assistant',
    nationalId: `ai-${crypto.randomUUID().slice(0, 8)}`,
    email: `ai-${crypto.randomUUID().slice(0, 8)}@test.com`,
  };

  const testDriver = {
    firstName: 'Driver',
    lastName: 'Test',
    nationalId: `driver-${crypto.randomUUID().slice(0, 8)}`,
    email: `driver-${crypto.randomUUID().slice(0, 8)}@test.com`,
  };

  const testMatchingUser = {
    firstName: 'Matching',
    lastName: 'User',
    nationalId: `matching-${crypto.randomUUID().slice(0, 8)}`,
    email: `matching-${crypto.randomUUID().slice(0, 8)}@test.com`,
  };

  const testNonMatchingUser = {
    firstName: 'NonMatching',
    lastName: 'User',
    nationalId: `nonmatching-${crypto.randomUUID().slice(0, 8)}`,
    email: `nonmatching-${crypto.randomUUID().slice(0, 8)}@test.com`,
  };

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp(
      ScheduleModule.forRoot(),
      RideMatchingCronModule,
      TypeOrmModule.forFeature([Notification]),
    ));

    service = app.get(RideMatchingCronService);
    userRepository = dataSource.getRepository(User);
    rideRepository = dataSource.getRepository(Ride);
    rideStopRepository = dataSource.getRepository(RideStop);
    ridePassengerRepository = dataSource.getRepository(RidePassenger);
    notificationRepository = dataSource.getRepository(Notification);
    organizationRepository = dataSource.getRepository(Organization);
  }, 60000);

  beforeEach(async () => {
    await cleanup();

    const org = await organizationRepository.save(
      organizationRepository.create({
        name: `Test Org ${crypto.randomUUID()}`,
      }),
    );
    testOrgId = org.id;

    const savedAiUser = await userRepository.save(
      userRepository.create({
        ...aiUser,
        passwordHash: 'dummy',
        role: UserRole.AI,
        organization: org,
      }),
    );
    aiUserId = savedAiUser.id;

    const driver = await userRepository.save(
      userRepository.create({
        ...testDriver,
        passwordHash: 'dummy',
        role: UserRole.BASIC_USER,
        organization: org,
        avgRideEmbedding: dissimilarEmbedding,
      }),
    );
    driverUserId = driver.id;

    const matchingUser = await userRepository.save(
      userRepository.create({
        ...testMatchingUser,
        passwordHash: 'dummy',
        role: UserRole.BASIC_USER,
        organization: org,
        avgRideEmbedding: similarEmbedding2,
      }),
    );
    matchingUserId = matchingUser.id;

    const nonMatchingUser = await userRepository.save(
      userRepository.create({
        ...testNonMatchingUser,
        passwordHash: 'dummy',
        role: UserRole.BASIC_USER,
        organization: org,
        avgRideEmbedding: dissimilarEmbedding,
      }),
    );
    nonMatchingUserId = nonMatchingUser.id;
  });

  afterAll(async () => {
    await cleanup();
    if (app) {
      await app.close();
    }
  });

  const cleanup = async () => {
    await notificationRepository.createQueryBuilder().delete().execute();
    await ridePassengerRepository.createQueryBuilder().delete().execute();
    await rideStopRepository.createQueryBuilder().delete().execute();
    await rideRepository.createQueryBuilder().delete().execute();
    await userRepository.createQueryBuilder().delete().execute();
    await organizationRepository.createQueryBuilder().delete().execute();

    testOrgId = null;
    aiUserId = null;
    driverUserId = null;
    matchingUserId = null;
    nonMatchingUserId = null;
  };

  describe('handleRideMatching', () => {
    it('should create notifications for users with similar embeddings', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const ride: Ride = await rideRepository.save(
        rideRepository.create({
          driver: { id: driverUserId! },
          organization: { id: testOrgId! },
          startsAt: futureDate,
          estimatedEndsAt: new Date(futureDate.getTime() + 3600000),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
          embedding: similarEmbedding1,
        }),
      );

      await rideStopRepository.save(
        rideStopRepository.create({
          ride: { id: ride.id },
          location: { type: 'Point', coordinates: [34.8516, 31.0461] },
          locationName: 'Test Stop',
          estimatedArrivalAt: futureDate,
          orderIndex: 0,
        }),
      );

      await service.handleRideMatching();

      const notifications = await notificationRepository.find({
        relations: ['creator', 'recipient', 'ride'],
      });

      expect(notifications.length).toBeGreaterThanOrEqual(1);

      const matchingNotification = notifications.find(
        (notification) => notification.recipient?.id === matchingUserId,
      );
      expect(matchingNotification).toBeDefined();
      expect(matchingNotification?.creator.id).toBe(aiUserId);
      expect(matchingNotification?.ride?.id).toBe(ride.id);
      expect(matchingNotification?.recipient?.id).toBe(matchingUserId);
      expect(matchingNotification?.content).toContain(
        'מצאנו נסיעה חדשה שמתאימה למסלולים הרגילים שלך! לחץ כאן כדי לראות את הפרטים ולהצטרף.',
      );
    });

    it('should not create notifications for users with dissimilar embeddings', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const ride: Ride = await rideRepository.save(
        rideRepository.create({
          driver: { id: driverUserId! },
          organization: { id: testOrgId! },
          startsAt: futureDate,
          estimatedEndsAt: new Date(futureDate.getTime() + 3600000),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
          embedding: similarEmbedding1,
        }),
      );

      await rideStopRepository.save(
        rideStopRepository.create({
          ride: { id: ride.id },
          location: { type: 'Point', coordinates: [34.8516, 31.0461] },
          locationName: 'Test Stop',
          estimatedArrivalAt: futureDate,
          orderIndex: 0,
        }),
      );

      await service.handleRideMatching();

      const notifications = await notificationRepository.find({
        relations: ['recipient'],
      });

      const nonMatchingNotification = notifications.find(
        (notification) => notification.recipient?.id === nonMatchingUserId,
      );
      expect(nonMatchingNotification).toBeUndefined();
    });

    it('should not create notifications for the driver of the ride', async () => {
      await userRepository.update(driverUserId!, {
        avgRideEmbedding: similarEmbedding2,
      });

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const ride: Ride = await rideRepository.save(
        rideRepository.create({
          driver: { id: driverUserId! },
          organization: { id: testOrgId! },
          startsAt: futureDate,
          estimatedEndsAt: new Date(futureDate.getTime() + 3600000),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
          embedding: similarEmbedding1,
        }),
      );

      await rideStopRepository.save(
        rideStopRepository.create({
          ride: { id: ride.id },
          location: { type: 'Point', coordinates: [34.8516, 31.0461] },
          locationName: 'Test Stop',
          estimatedArrivalAt: futureDate,
          orderIndex: 0,
        }),
      );

      await service.handleRideMatching();

      const notifications = await notificationRepository.find({
        relations: ['recipient'],
      });

      const driverNotification = notifications.find(
        (notification) => notification.recipient?.id === driverUserId,
      );
      expect(driverNotification).toBeUndefined();
    });

    it('should not create duplicate notifications for the same user-ride pair', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const ride: Ride = await rideRepository.save(
        rideRepository.create({
          driver: { id: driverUserId! },
          organization: { id: testOrgId! },
          startsAt: futureDate,
          estimatedEndsAt: new Date(futureDate.getTime() + 3600000),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
          embedding: similarEmbedding1,
        }),
      );

      await rideStopRepository.save(
        rideStopRepository.create({
          ride: { id: ride.id },
          location: { type: 'Point', coordinates: [34.8516, 31.0461] },
          locationName: 'Test Stop',
          estimatedArrivalAt: futureDate,
          orderIndex: 0,
        }),
      );

      await service.handleRideMatching();

      const notifications = await notificationRepository.find({
        relations: ['recipient', 'ride'],
      });

      const matchingNotifications = notifications.filter(
        (notification) =>
          notification.recipient?.id === matchingUserId &&
          notification.ride?.id === ride.id,
      );

      expect(matchingNotifications.length).toBe(1);

      await service.handleRideMatching();

      //verify again
      const notificationsSecondTime = await notificationRepository.find({
        relations: ['recipient', 'ride'],
      });

      const matchingNotificationsSecondTime = notificationsSecondTime.filter(
        (notification) =>
          notification.recipient?.id === matchingUserId &&
          notification.ride?.id === ride.id,
      );

      expect(matchingNotificationsSecondTime.length).toBe(1);
    });

    it('should skip processing if no AI user exists', async () => {
      await userRepository.delete({ role: UserRole.AI });

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await rideRepository.save(
        rideRepository.create({
          driver: { id: driverUserId! },
          organization: { id: testOrgId! },
          startsAt: futureDate,
          estimatedEndsAt: new Date(futureDate.getTime() + 3600000),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
          embedding: similarEmbedding1,
        }),
      );

      await service.handleRideMatching();

      const notifications = await notificationRepository.find();
      expect(notifications.length).toBe(0);
    });

    it('should not process rides without embeddings', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await rideRepository.save(
        rideRepository.create({
          driver: { id: driverUserId! },
          organization: { id: testOrgId! },
          startsAt: futureDate,
          estimatedEndsAt: new Date(futureDate.getTime() + 3600000),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
          embedding: null,
        }),
      );

      await service.handleRideMatching();

      const notifications = await notificationRepository.find();
      expect(notifications.length).toBe(0);
    });

    it('should not process rides that have already started', async () => {
      const now = new Date();
      await rideRepository.save(
        rideRepository.create({
          driver: { id: driverUserId! },
          organization: { id: testOrgId! },
          startsAt: now,
          estimatedEndsAt: new Date(now.getTime() + 3600000),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.ACTIVE,
          embedding: similarEmbedding1,
        }),
      );

      await service.handleRideMatching();

      const notifications = await notificationRepository.find();
      expect(notifications.length).toBe(0);
    });

    it('should not process rides that are full', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const ride: Ride = await rideRepository.save(
        rideRepository.create({
          driver: { id: driverUserId! },
          organization: { id: testOrgId! },
          startsAt: futureDate,
          estimatedEndsAt: new Date(futureDate.getTime() + 3600000),
          maxSeatsAmount: 1,
          rideStatus: RideStatus.PENDING,
          embedding: similarEmbedding1,
        }),
      );

      const stop = await rideStopRepository.save(
        rideStopRepository.create({
          ride: { id: ride.id },
          location: { type: 'Point', coordinates: [34.8516, 31.0461] },
          locationName: 'Test Stop',
          estimatedArrivalAt: futureDate,
          orderIndex: 0,
        }),
      );

      await ridePassengerRepository.save(
        ridePassengerRepository.create({
          ride: { id: ride.id },
          user: { id: nonMatchingUserId! },
          rideStop: { id: stop.id },
        }),
      );

      await service.handleRideMatching();

      const notifications = await notificationRepository.find();
      expect(notifications.length).toBe(0);
    });

    it('should not create notifications for users from different organizations', async () => {
      const otherOrg = await organizationRepository.save(
        organizationRepository.create({
          name: `Other Org ${crypto.randomUUID()}`,
        }),
      );

      const otherOrgUser = await userRepository.save(
        userRepository.create({
          firstName: 'OtherOrg',
          lastName: 'User',
          nationalId: `otherorg-${crypto.randomUUID().slice(0, 8)}`,
          email: `otherorg-${crypto.randomUUID().slice(0, 8)}@test.com`,
          passwordHash: 'dummy',
          role: UserRole.BASIC_USER,
          organization: otherOrg,
          avgRideEmbedding: similarEmbedding2,
        }),
      );

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const ride: Ride = await rideRepository.save(
        rideRepository.create({
          driver: { id: driverUserId! },
          organization: { id: testOrgId! },
          startsAt: futureDate,
          estimatedEndsAt: new Date(futureDate.getTime() + 3600000),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
          embedding: similarEmbedding1,
        }),
      );

      await rideStopRepository.save(
        rideStopRepository.create({
          ride: { id: ride.id },
          location: { type: 'Point', coordinates: [34.8516, 31.0461] },
          locationName: 'Test Stop',
          estimatedArrivalAt: futureDate,
          orderIndex: 0,
        }),
      );

      await service.handleRideMatching();

      const notifications = await notificationRepository.find({
        relations: ['recipient'],
      });

      const sameOrgNotification = notifications.find(
        (notification) => notification.recipient?.id === matchingUserId,
      );
      expect(sameOrgNotification).toBeDefined();

      const otherOrgNotification = notifications.find(
        (notification) => notification.recipient?.id === otherOrgUser.id,
      );
      expect(otherOrgNotification).toBeUndefined();
    });

    it('should not create notifications for users who are already passengers on the ride', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const ride: Ride = await rideRepository.save(
        rideRepository.create({
          driver: { id: driverUserId! },
          organization: { id: testOrgId! },
          startsAt: futureDate,
          estimatedEndsAt: new Date(futureDate.getTime() + 3600000),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
          embedding: similarEmbedding1,
        }),
      );

      const stop = await rideStopRepository.save(
        rideStopRepository.create({
          ride: { id: ride.id },
          location: { type: 'Point', coordinates: [34.8516, 31.0461] },
          locationName: 'Test Stop',
          estimatedArrivalAt: futureDate,
          orderIndex: 0,
        }),
      );

      await ridePassengerRepository.save(
        ridePassengerRepository.create({
          ride: { id: ride.id },
          user: { id: matchingUserId! },
          rideStop: { id: stop.id },
        }),
      );

      await service.handleRideMatching();

      const notifications = await notificationRepository.find({
        relations: ['recipient'],
      });

      const passengerNotification = notifications.find(
        (notification) => notification.recipient?.id === matchingUserId,
      );
      expect(passengerNotification).toBeUndefined();
    });
  });
});
