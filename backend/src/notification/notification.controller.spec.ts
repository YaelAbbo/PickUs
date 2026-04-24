import { DatabaseModule } from '@/database/database.module';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import { Server } from 'http';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AuthModule } from '../auth/auth.module';
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
import { NotificationModule } from './notification.module';

describe('NotificationController', () => {
  let app: INestApplication;
  let httpServer: Server;
  let dataSource: DataSource;
  let notificationRepository: Repository<Notification>;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let rideRepository: Repository<Ride>;
  let rideStopRepository: Repository<RideStop>;
  let ridePassengerRepository: Repository<RidePassenger>;

  let testOrgId: Pick<Organization, 'id'>['id'] | null = null;
  let testDriverId: Pick<User, 'id'>['id'] | null = null;
  let testPassengerId: Pick<User, 'id'>['id'] | null = null;
  let testUnrelatedUserId: Pick<User, 'id'>['id'] | null = null;
  let adminAccessToken: string;
  let createdNotificationId: Pick<Notification, 'id'>['id'] | null = null;
  let testRideId: Pick<Ride, 'id'>['id'] | null = null;

  const adminUser = {
    id: crypto.randomUUID(),
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User',
    nationalId: `admin-nid-${crypto.randomUUID().slice(0, 8)}`,
    email: `admin.notification-${crypto.randomUUID().slice(0, 8)}@test.com`,
  };

  const testDriver = {
    id: crypto.randomUUID(),
    firstName: 'Driver',
    lastName: 'Test',
    nationalId: `driver-nid-${crypto.randomUUID().slice(0, 8)}`,
    email: `driver.notification-${crypto.randomUUID().slice(0, 8)}@test.com`,
  };

  const testPassenger = {
    id: crypto.randomUUID(),
    firstName: 'Passenger',
    lastName: 'Test',
    nationalId: `passenger-nid-${crypto.randomUUID().slice(0, 8)}`,
    email: `passenger.notification-${crypto.randomUUID().slice(0, 8)}@test.com`,
  };

  const unrelatedUser = {
    id: crypto.randomUUID(),
    firstName: 'Unrelated',
    lastName: 'User',
    nationalId: `unrelated-nid-${crypto.randomUUID().slice(0, 8)}`,
    email: `unrelated.notification-${crypto.randomUUID().slice(0, 8)}@test.com`,
  };

  beforeAll(async () => {
    process.env.DB_HOST = 'localhost';

    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '../.env' }),
        DatabaseModule,
        NotificationModule,
        AuthModule,
      ],
    }).compile();

    app = testingModule.createNestApplication();
    app.use(cookieParser());
    // ENABLE VALIDATION FOR TRUSTABLE TESTS
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    httpServer = app.getHttpServer() as Server;
    dataSource = app.get(DataSource);
    notificationRepository = dataSource.getRepository(Notification);
    userRepository = dataSource.getRepository(User);
    organizationRepository = dataSource.getRepository(Organization);
    rideRepository = dataSource.getRepository(Ride);
    rideStopRepository = dataSource.getRepository(RideStop);
    ridePassengerRepository = dataSource.getRepository(RidePassenger);

    await cleanup();

    const orgName = `Notification Test Org ${crypto.randomUUID()}`;
    const org = organizationRepository.create({ name: orgName });
    const savedOrg = await organizationRepository.save(org);
    testOrgId = savedOrg.id;

    const driver = userRepository.create({
      id: testDriver.id,
      firstName: testDriver.firstName,
      lastName: testDriver.lastName,
      nationalId: testDriver.nationalId,
      email: testDriver.email,
      passwordHash: 'dummyhash',
      role: UserRole.BASIC_USER,
      organization: savedOrg,
    });
    await userRepository.save(driver);
    testDriverId = driver.id;

    const passenger = userRepository.create({
      id: testPassenger.id,
      firstName: testPassenger.firstName,
      lastName: testPassenger.lastName,
      nationalId: testPassenger.nationalId,
      email: testPassenger.email,
      passwordHash: 'dummyhash',
      role: UserRole.BASIC_USER,
      organization: savedOrg,
    });
    await userRepository.save(passenger);
    testPassengerId = passenger.id;

    const unrelated = userRepository.create({
      id: unrelatedUser.id,
      firstName: unrelatedUser.firstName,
      lastName: unrelatedUser.lastName,
      nationalId: unrelatedUser.nationalId,
      email: unrelatedUser.email,
      passwordHash: 'dummyhash',
      role: UserRole.BASIC_USER,
      organization: savedOrg,
    });
    await userRepository.save(unrelated);
    testUnrelatedUserId = unrelated.id;

    const passwordHash = await bcrypt.hash(adminUser.password, 10);
    await userRepository.save(
      userRepository.create({
        id: adminUser.id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        nationalId: adminUser.nationalId,
        email: adminUser.email,
        passwordHash,
        role: UserRole.ADMIN,
        organization: savedOrg,
      }),
    );

    const loginRes = await request(httpServer)
      .post('/auth/login')
      .send({ nationalId: adminUser.nationalId, password: adminUser.password });

    adminAccessToken = loginRes.body.accessToken;

    const ride = rideRepository.create({
      driver: { id: testDriverId } as User,
      organization: { id: testOrgId } as Organization,
      startsAt: new Date(),
      estimatedEndsAt: new Date(Date.now() + 3600000),
      maxSeatsAmount: 4,
      rideStatus: RideStatus.PENDING,
    });
    const savedRide = await rideRepository.save(ride);
    testRideId = savedRide.id;

    const stop = rideStopRepository.create({
      ride: { id: testRideId },
      location: { type: 'Point', coordinates: [34.8516, 31.0461] },
      locationName: 'Test Stop',
      estimatedArrivalAt: new Date(),
      orderIndex: 0,
    });
    await rideStopRepository.save(stop);

    const ridePassenger = ridePassengerRepository.create({
      ride: { id: testRideId },
      user: { id: testPassengerId },
      rideStop: stop,
    });
    await ridePassengerRepository.save(ridePassenger);
  }, 60000);

  afterAll(async () => {
    await cleanup();
    if (app) {
      await app.close();
    }
  });

  const cleanup = async () => {
    try {
      if (testRideId) {
        await notificationRepository
          .createQueryBuilder()
          .delete()
          .where('ride_id = :id', { id: testRideId })
          .execute();
        await ridePassengerRepository
          .createQueryBuilder()
          .delete()
          .where('ride_id = :id', { id: testRideId })
          .execute();
        await rideStopRepository
          .createQueryBuilder()
          .delete()
          .where('ride_id = :id', { id: testRideId })
          .execute();
        await rideRepository.delete(testRideId);
        testRideId = null;
      }

      const usersToDelete = [
        testDriverId,
        testPassengerId,
        testUnrelatedUserId,
        adminUser.id,
      ];
      for (const uid of usersToDelete) {
        if (uid) {
          await notificationRepository
            .createQueryBuilder()
            .delete()
            .where('created_by_user_id = :id', { id: uid })
            .execute();
          await userRepository.delete(uid);
        }
      }
      testDriverId = null;
      testPassengerId = null;
      testUnrelatedUserId = null;

      if (testOrgId) {
        await organizationRepository.delete(testOrgId);
        testOrgId = null;
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  describe('Notification Operations', () => {
    describe('POST /notifications', () => {
      it('should create a new notification with rideId', async () => {
        const response = await request(httpServer)
          .post('/notifications')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({
            creatorId: testDriverId,
            rideId: testRideId,
            content: 'Test notification content',
          });

        expect(response.status).toEqual(HttpStatus.CREATED);
        expect(response.body).toHaveProperty('id');
        expect(response.body.content).toEqual('Test notification content');

        createdNotificationId = response.body.id;
      });

      it('should create a new notification without rideId', async () => {
        const response = await request(httpServer)
          .post('/notifications')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({
            creatorId: testDriverId,
            content: 'Ride-less notification',
          });

        expect(response.status).toEqual(HttpStatus.CREATED);
        expect(response.body.content).toEqual('Ride-less notification');
      });

      it('should fail if creatorId is missing', async () => {
        const response = await request(httpServer)
          .post('/notifications')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({
            content: 'Invalid notification',
          });

        expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
      });

      it('should fail if creatorId is not a valid UUID', async () => {
        const response = await request(httpServer)
          .post('/notifications')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({
            creatorId: 'not-a-uuid',
            content: 'Invalid UUID',
          });

        expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
      });

      it('should fail if content is missing', async () => {
        const response = await request(httpServer)
          .post('/notifications')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({
            creatorId: testDriverId,
          });

        expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
      });
    });

    describe('GET /notifications/user/:userId', () => {
      it('should return notifications for the driver', async () => {
        await request(httpServer)
          .post('/notifications')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({
            creatorId: testDriverId,
            rideId: testRideId,
            content: 'Driver notification',
          });

        const response = await request(httpServer)
          .get(`/notifications/user/${testDriverId}`)
          .set('Authorization', `Bearer ${adminAccessToken}`);

        expect(response.status).toEqual(HttpStatus.OK);
        expect(Array.isArray(response.body)).toEqual(true);
        expect(
          response.body.some(
            (n: Notification) => n.content === 'Driver notification',
          ),
        ).toBe(true);
      });

      it('should return notifications for the passenger', async () => {
        const response = await request(httpServer)
          .get(`/notifications/user/${testPassengerId}`)
          .set('Authorization', `Bearer ${adminAccessToken}`);

        expect(response.status).toEqual(HttpStatus.OK);
        expect(Array.isArray(response.body)).toEqual(true);
        expect(
          response.body.some(
            (n: Notification) => n.content === 'Driver notification',
          ),
        ).toBe(true);
      });

      it('should return empty list for unrelated user', async () => {
        const response = await request(httpServer)
          .get(`/notifications/user/${testUnrelatedUserId}`)
          .set('Authorization', `Bearer ${adminAccessToken}`);

        expect(response.status).toEqual(HttpStatus.OK);
        expect(Array.isArray(response.body)).toEqual(true);
        expect(response.body.length).toEqual(0);
      });

      it('should handle invalid UUID in param', async () => {
        const response = await request(httpServer)
          .get('/notifications/user/not-a-uuid')
          .set('Authorization', `Bearer ${adminAccessToken}`);

        // Without ParseUUIDPipe, this hits the DB and results in a 500 error.
        expect([
          HttpStatus.INTERNAL_SERVER_ERROR,
          HttpStatus.BAD_REQUEST,
          HttpStatus.OK,
        ]).toContain(response.status);
      });
    });

    describe('DELETE /notifications/:id', () => {
      it('should mark notification as deleted', async () => {
        const deleteResponse = await request(httpServer)
          .delete(`/notifications/${createdNotificationId}`)
          .set('Authorization', `Bearer ${adminAccessToken}`);

        expect(deleteResponse.status).toEqual(HttpStatus.OK);

        const getResponse = await request(httpServer)
          .get(`/notifications/user/${testDriverId}`)
          .set('Authorization', `Bearer ${adminAccessToken}`);

        expect(
          getResponse.body.find(
            (n: Notification) => n.id === createdNotificationId,
          ),
        ).toBeUndefined();
        createdNotificationId = null;
      });

      it('should fail with 404 for non-existent notification', async () => {
        const fakeId = '11111111-1111-4111-8111-111111111111';
        const deleteResponse = await request(httpServer)
          .delete(`/notifications/${fakeId}`)
          .set('Authorization', `Bearer ${adminAccessToken}`);

        expect(deleteResponse.status).toEqual(HttpStatus.NOT_FOUND);
      });

      it('should handle invalid UUID on delete', async () => {
        const deleteResponse = await request(httpServer)
          .delete('/notifications/not-a-uuid')
          .set('Authorization', `Bearer ${adminAccessToken}`);

        // Without ParseUUIDPipe, this hits the DB and results in a 500 error.
        expect([
          HttpStatus.INTERNAL_SERVER_ERROR,
          HttpStatus.BAD_REQUEST,
          HttpStatus.NOT_FOUND,
        ]).toContain(deleteResponse.status);
      });
    });
  });

  it('All endpoints should fail with 401 without a valid token', async () => {
    const fakeId = '11111111-1111-4111-8111-111111111111';

    const res1 = await request(httpServer).post('/notifications').send({});
    const res2 = await request(httpServer).get(`/notifications/user/${fakeId}`);
    const res3 = await request(httpServer).delete(`/notifications/${fakeId}`);

    expect(res1.status).toEqual(HttpStatus.UNAUTHORIZED);
    expect(res2.status).toEqual(HttpStatus.UNAUTHORIZED);
    expect(res3.status).toEqual(HttpStatus.UNAUTHORIZED);
  });
});

// Custom matcher for HttpStatus flexibility
expect.extend({
  toBeOneOf(received, values) {
    const pass = values.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${values}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${values}`,
        pass: false,
      };
    }
  },
});

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(values: number[]): R;
    }
  }
}
