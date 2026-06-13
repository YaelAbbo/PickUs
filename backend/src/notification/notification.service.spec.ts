import { createTestApp } from '@/test/createTestApp';
import { INestApplication } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  Notification,
  Organization,
  Ride,
  RidePassenger,
  RideStop,
  User,
  UserRole,
} from '../database/entities';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationModule } from './notification.module';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let app: INestApplication;
  let service: NotificationService;
  let dataSource: DataSource;
  let notificationRepository: Repository<Notification>;
  let userRepository: Repository<User>;
  let rideRepository: Repository<Ride>;
  let organizationRepository: Repository<Organization>;
  let ridePassengerRepository: Repository<RidePassenger>;
  let rideStopRepository: Repository<RideStop>;

  let testOrgId: Organization['id'] | null = null;
  let creatorUserId: User['id'] | null = null;
  let recipient1UserId: User['id'] | null = null;
  let recipient2UserId: User['id'] | null = null;
  let testRideId: Ride['id'] | null = null;

  const creatorUser = {
    firstName: 'Creator',
    lastName: 'User',
    nationalId: `creator-${crypto.randomUUID().slice(0, 8)}`,
    email: `creator-${crypto.randomUUID().slice(0, 8)}@test.com`,
    phoneNumber: `+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
  };

  const recipient1User = {
    firstName: 'Recipient1',
    lastName: 'User',
    nationalId: `recipient1-${crypto.randomUUID().slice(0, 8)}`,
    email: `recipient1-${crypto.randomUUID().slice(0, 8)}@test.com`,
    phoneNumber: `+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
  };

  const recipient2User = {
    firstName: 'Recipient2',
    lastName: 'User',
    nationalId: `recipient2-${crypto.randomUUID().slice(0, 8)}`,
    email: `recipient2-${crypto.randomUUID().slice(0, 8)}@test.com`,
    phoneNumber: `+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
  };

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp(NotificationModule));

    service = app.get(NotificationService);
    notificationRepository = dataSource.getRepository(Notification);
    userRepository = dataSource.getRepository(User);
    rideRepository = dataSource.getRepository(Ride);
    organizationRepository = dataSource.getRepository(Organization);
    ridePassengerRepository = dataSource.getRepository(RidePassenger);
    rideStopRepository = dataSource.getRepository(RideStop);
  }, 60000);

  beforeEach(async () => {
    await cleanup();

    const org = await organizationRepository.save(
      organizationRepository.create({
        name: `Test Org ${crypto.randomUUID()}`,
      }),
    );
    testOrgId = org.id;

    const creator = await userRepository.save(
      userRepository.create({
        ...creatorUser,
        passwordHash: 'dummy',
        role: UserRole.BASIC_USER,
        organization: org,
      }),
    );
    creatorUserId = creator.id;

    const recipient1 = await userRepository.save(
      userRepository.create({
        ...recipient1User,
        passwordHash: 'dummy',
        role: UserRole.BASIC_USER,
        organization: org,
      }),
    );
    recipient1UserId = recipient1.id;

    const recipient2 = await userRepository.save(
      userRepository.create({
        ...recipient2User,
        passwordHash: 'dummy',
        role: UserRole.BASIC_USER,
        organization: org,
      }),
    );
    recipient2UserId = recipient2.id;

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const ride = await rideRepository.save(
      rideRepository.create({
        driver: { id: creatorUserId },
        organization: { id: testOrgId },
        startsAt: futureDate,
        estimatedEndsAt: new Date(futureDate.getTime() + 3600000),
        maxSeatsAmount: 4,
      }),
    );
    testRideId = ride.id;
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
    await organizationRepository
      .createQueryBuilder()
      .update()
      .set({ admin: null })
      .execute();
    await userRepository.createQueryBuilder().delete().execute();
    await organizationRepository.createQueryBuilder().delete().execute();

    testOrgId = null;
    creatorUserId = null;
    recipient1UserId = null;
    recipient2UserId = null;
    testRideId = null;
  };

  describe('create', () => {
    it('should create a notification with all fields', async () => {
      const dto: CreateNotificationDto = {
        creatorId: creatorUserId!,
        recipientId: recipient1UserId!,
        rideId: testRideId!,
        content: 'Test notification',
      };

      const notification = await service.create(dto);

      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.content).toBe('Test notification');

      const savedNotification = await notificationRepository.findOne({
        where: { id: notification.id },
        relations: ['creator', 'recipient', 'ride'],
      });

      expect(savedNotification).toBeDefined();
      expect(savedNotification?.creator.id).toBe(creatorUserId);
      expect(savedNotification?.recipient.id).toBe(recipient1UserId);
      expect(savedNotification?.ride?.id).toBe(testRideId);
    });

    it('should create a notification without a ride', async () => {
      const dto: CreateNotificationDto = {
        creatorId: creatorUserId!,
        recipientId: recipient1UserId!,
        content: 'Test notification without ride',
      };

      const notification = await service.create(dto);

      expect(notification).toBeDefined();
      expect(notification.content).toBe('Test notification without ride');

      const savedNotification = await notificationRepository.findOne({
        where: { id: notification.id },
        relations: ['creator', 'recipient', 'ride'],
      });

      expect(savedNotification).toBeDefined();
      expect(savedNotification?.creator.id).toBe(creatorUserId);
      expect(savedNotification?.recipient.id).toBe(recipient1UserId);
      expect(savedNotification?.ride).toBeNull();
    });
  });

  describe('createBulk', () => {
    it('should create multiple notifications in a single transaction', async () => {
      const dtos: CreateNotificationDto[] = [
        {
          creatorId: creatorUserId!,
          recipientId: recipient1UserId!,
          rideId: testRideId!,
          content: 'Notification 1',
        },
        {
          creatorId: creatorUserId!,
          recipientId: recipient2UserId!,
          rideId: testRideId!,
          content: 'Notification 2',
        },
      ];

      await service.createBulk(dtos);

      const notifications = await notificationRepository.find({
        relations: ['creator', 'recipient', 'ride'],
        where: { isDeleted: false },
      });

      expect(notifications).toHaveLength(2);
      expect(notifications[0]!.creator.id).toBe(creatorUserId);
      expect(notifications[1]!.creator.id).toBe(creatorUserId);

      const recipientIds = notifications
        .map((notification) => notification.recipient.id)
        .sort();
      expect(recipientIds).toEqual([recipient1UserId, recipient2UserId].sort());

      expect(
        notifications.every(
          (notification) => notification.ride?.id === testRideId,
        ),
      ).toBe(true);
    });

    it('should create bulk notifications with mixed ride associations', async () => {
      const dtos: CreateNotificationDto[] = [
        {
          creatorId: creatorUserId!,
          recipientId: recipient1UserId!,
          rideId: testRideId!,
          content: 'With ride',
        },
        {
          creatorId: creatorUserId!,
          recipientId: recipient2UserId!,
          content: 'Without ride',
        },
      ];

      await service.createBulk(dtos);

      const notifications = await notificationRepository.find({
        relations: ['creator', 'recipient', 'ride'],
        where: { isDeleted: false },
      });

      expect(notifications).toHaveLength(2);

      const withRide = notifications.find(
        (notification) => notification.recipient.id === recipient1UserId,
      );
      const withoutRide = notifications.find(
        (notification) => notification.recipient.id === recipient2UserId,
      );

      expect(withRide?.ride?.id).toBe(testRideId);
      expect(withoutRide?.ride).toBeNull();
    });

    it('should handle empty array', async () => {
      await service.createBulk([]);

      const notifications = await notificationRepository.find();
      expect(notifications).toHaveLength(0);
    });
  });

  describe('getExistingRecipientRidePairs', () => {
    beforeEach(async () => {
      await service.createBulk([
        {
          creatorId: creatorUserId!,
          recipientId: recipient1UserId!,
          rideId: testRideId!,
          content: 'Test notification 1',
        },
        {
          creatorId: creatorUserId!,
          recipientId: recipient2UserId!,
          rideId: testRideId!,
          content: 'Test notification 2',
        },
      ]);
    });

    it('should return existing recipient-ride pairs', async () => {
      const pairs = await service.getExistingRecipientRidePairs(
        [testRideId!],
        [recipient1UserId!, recipient2UserId!],
      );

      expect(pairs.size).toBe(2);
      expect(pairs.has(`${recipient1UserId}:${testRideId}`)).toBe(true);
      expect(pairs.has(`${recipient2UserId}:${testRideId}`)).toBe(true);
    });

    it('should filter by ride IDs', async () => {
      const nonExistentRideId = crypto.randomUUID();
      const pairs = await service.getExistingRecipientRidePairs(
        [nonExistentRideId],
        [recipient1UserId!, recipient2UserId!],
      );

      expect(pairs.size).toBe(0);
    });

    it('should filter by user IDs', async () => {
      const nonExistentUserId = crypto.randomUUID();
      const pairs = await service.getExistingRecipientRidePairs(
        [testRideId!],
        [nonExistentUserId],
      );

      expect(pairs.size).toBe(0);
    });

    it('should only return non-deleted notifications', async () => {
      const notification = await notificationRepository.findOne({
        where: { recipient: { id: recipient1UserId! } },
      });
      await service.delete(notification!.id);

      const pairs = await service.getExistingRecipientRidePairs(
        [testRideId!],
        [recipient1UserId!, recipient2UserId!],
      );

      expect(pairs.size).toBe(1);
      expect(pairs.has(`${recipient1UserId}:${testRideId}`)).toBe(false);
      expect(pairs.has(`${recipient2UserId}:${testRideId}`)).toBe(true);
    });

    it('should handle multiple rides', async () => {
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const ride2 = await rideRepository.save(
        rideRepository.create({
          driver: { id: creatorUserId! },
          organization: { id: testOrgId! },
          startsAt: futureDate,
          estimatedEndsAt: new Date(futureDate.getTime() + 3600000),
          maxSeatsAmount: 4,
        }),
      );

      await service.create({
        creatorId: creatorUserId!,
        recipientId: recipient1UserId!,
        rideId: ride2.id,
        content: 'Second ride notification',
      });

      const pairs = await service.getExistingRecipientRidePairs(
        [testRideId!, ride2.id],
        [recipient1UserId!],
      );

      expect(pairs.size).toBe(2);
      expect(pairs.has(`${recipient1UserId}:${testRideId}`)).toBe(true);
      expect(pairs.has(`${recipient1UserId}:${ride2.id}`)).toBe(true);
    });

    it('should return empty set for empty input arrays', async () => {
      const pairs = await service.getExistingRecipientRidePairs([], []);
      expect(pairs.size).toBe(0);
    });
  });

  describe('getUserNotifications', () => {
    it('should return notifications where user is the direct recipient', async () => {
      const aiUser = await userRepository.save(
        userRepository.create({
          firstName: 'PickUs',
          lastName: 'AI',
          nationalId: `ai-${crypto.randomUUID().slice(0, 8)}`,
          email: `ai-${crypto.randomUUID().slice(0, 8)}@test.com`,
          phoneNumber: `+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
          passwordHash: 'dummy',
          role: UserRole.AI,
          organization: { id: testOrgId! },
        }),
      );

      const otherRide = await rideRepository.save(
        rideRepository.create({
          driver: { id: creatorUserId! },
          organization: { id: testOrgId! },
          startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          estimatedEndsAt: new Date(Date.now() + 25 * 60 * 60 * 1000),
          maxSeatsAmount: 4,
        }),
      );

      await service.create({
        creatorId: aiUser.id,
        recipientId: recipient2UserId!,
        rideId: otherRide.id,
        content: 'AI found a matching ride for you!',
      });

      const notifications = await service.getUserNotifications(
        recipient2UserId!,
      );

      expect(notifications).toHaveLength(1);
      expect(notifications[0]?.content).toBe(
        'AI found a matching ride for you!',
      );
      expect(notifications[0]?.creator.id).toBe(aiUser.id);

      await notificationRepository
        .createQueryBuilder()
        .delete()
        .where('ride_id = :id', { id: otherRide.id })
        .execute();
      await rideRepository.delete(otherRide.id);
      await userRepository.delete(aiUser.id);
    });

    it('should combine recipient notifications with driver/passenger notifications', async () => {
      const aiUser = await userRepository.save(
        userRepository.create({
          firstName: 'PickUs',
          lastName: 'AI',
          nationalId: `ai3-${crypto.randomUUID().slice(0, 8)}`,
          email: `ai3-${crypto.randomUUID().slice(0, 8)}@test.com`,
          phoneNumber: `+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
          passwordHash: 'dummy',
          role: UserRole.AI,
          organization: { id: testOrgId! },
        }),
      );

      await service.create({
        creatorId: recipient2UserId!,
        recipientId: creatorUserId!,
        rideId: testRideId!,
        content: 'Driver notification from passenger',
      });

      await service.create({
        creatorId: aiUser.id,
        recipientId: creatorUserId!,
        content: 'AI suggestion for you',
      });

      const notifications = await service.getUserNotifications(creatorUserId!);

      expect(notifications.length).toBeGreaterThanOrEqual(2);
      expect(
        notifications.some(
          (notification) =>
            notification.content === 'Driver notification from passenger',
        ),
      ).toBe(true);
      expect(
        notifications.some(
          (notification) => notification.content === 'AI suggestion for you',
        ),
      ).toBe(true);

      await notificationRepository
        .createQueryBuilder()
        .delete()
        .where('created_by_user_id = :id', { id: aiUser.id })
        .execute();
      await userRepository.delete(aiUser.id);
    });
  });

  describe('delete', () => {
    it('should soft delete a notification', async () => {
      const notification = await service.create({
        creatorId: creatorUserId!,
        recipientId: recipient1UserId!,
        rideId: testRideId!,
        content: 'To be deleted',
      });

      await service.delete(notification.id);

      const deleted = await notificationRepository.findOne({
        where: { id: notification.id },
      });

      expect(deleted?.isDeleted).toBe(true);
    });

    it('should throw NotFoundException when notification does not exist', async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(service.delete(nonExistentId)).rejects.toThrow(
        `Notification with ID ${nonExistentId} not found`,
      );
    });

    it('should throw NotFoundException when notification is already deleted', async () => {
      const notification = await service.create({
        creatorId: creatorUserId!,
        recipientId: recipient1UserId!,
        content: 'To be deleted',
      });

      await service.delete(notification.id);

      await expect(service.delete(notification.id)).rejects.toThrow(
        `Notification with ID ${notification.id} not found`,
      );
    });
  });
});
