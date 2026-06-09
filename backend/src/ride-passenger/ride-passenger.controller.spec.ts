import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { UUID } from 'crypto';
import { Server } from 'http';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  Organization,
  Ride,
  RidePassenger,
  RideStatus,
  RideStop,
  User,
  UserRole,
} from '../database/entities';
import { RideModule } from '../ride/ride.module';
import { createTestApp } from '../test/createTestApp';
import { RidePassengerModule } from './ride-passenger.module';

describe('RidePassengerController', () => {
  let app: INestApplication;
  let httpServer: Server;
  let dataSource: DataSource;
  let rideRepository: Repository<Ride>;
  let rideStopRepository: Repository<RideStop>;
  let ridePassengerRepository: Repository<RidePassenger>;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;

  let testOrgId: UUID;
  let testDriverId: UUID;
  let adminAccessToken: string;

  let rideId: UUID;
  let rideStopId: UUID;
  let altRideStopId: UUID;
  let passengerAccessToken: string;

  const adminUser = {
    id: crypto.randomUUID(),
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User',
    nationalId: `admin-nid-${crypto.randomUUID().slice(0, 8)}`,
    email: `admin.rp-${crypto.randomUUID().slice(0, 8)}@test.com`,
    phoneNumber: `admin.+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
  };

  const testDriver = {
    id: crypto.randomUUID(),
    firstName: 'Driver',
    lastName: 'Test',
    nationalId: `driver-nid-${crypto.randomUUID().slice(0, 8)}`,
    email: `driver.rp-${crypto.randomUUID().slice(0, 8)}@test.com`,
    phoneNumber: `driver.+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
  };

  const passengerUser = {
    id: crypto.randomUUID() as UUID,
    password: 'PassengerPass123!',
    firstName: 'Passenger',
    lastName: 'User',
    nationalId: `passenger-nid-${crypto.randomUUID().slice(0, 8)}`,
    email: `passenger.rp-${crypto.randomUUID().slice(0, 8)}@test.com`,
    phoneNumber: `passenger.+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
  };

  const baseRideDto = {
    startLocation: { type: 'Point', coordinates: [34.8516, 31.0461] },
    endLocation: { type: 'Point', coordinates: [34.7818, 32.0853] },
    rideStatus: RideStatus.PENDING,
  };

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp(
      RidePassengerModule,
      RideModule,
      AuthModule,
    ));

    httpServer = app.getHttpServer() as Server;
    rideRepository = dataSource.getRepository(Ride);
    rideStopRepository = dataSource.getRepository(RideStop);
    ridePassengerRepository = dataSource.getRepository(RidePassenger);
    userRepository = dataSource.getRepository(User);
    organizationRepository = dataSource.getRepository(Organization);

    const orgName = `RidePassenger Test Org ${crypto.randomUUID()}`;
    const org = organizationRepository.create({
      name: orgName,
    });
    const savedOrg = await organizationRepository.save(org);
    testOrgId = savedOrg.id;

    await userRepository.save(
      userRepository.create({
        id: testDriver.id,
        firstName: testDriver.firstName,
        lastName: testDriver.lastName,
        nationalId: testDriver.nationalId,
        email: testDriver.email,
        phoneNumber: testDriver.phoneNumber,
        passwordHash: 'dummyhash',
        role: UserRole.BASIC_USER,
        organization: savedOrg,
      }),
    );
    testDriverId = testDriver.id;

    const passwordHash = await bcrypt.hash(adminUser.password, 10);
    await userRepository.save(
      userRepository.create({
        id: adminUser.id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        nationalId: adminUser.nationalId,
        email: adminUser.email,
        phoneNumber: adminUser.phoneNumber,
        passwordHash,
        role: UserRole.ADMIN,
        organization: savedOrg,
      }),
    );

    const loginRes = await request(httpServer)
      .post('/auth/login')
      .send({ nationalId: adminUser.nationalId, password: adminUser.password });
    adminAccessToken = loginRes.body.accessToken;
  }, 60000);

  afterAll(async () => {
    if (testOrgId) {
      await ridePassengerRepository.query(
        `DELETE FROM "ride_passenger" WHERE "ride_id" IN (SELECT "id" FROM "ride" WHERE "org_id" = '${testOrgId}')`,
      );
      await rideStopRepository.query(
        `DELETE FROM "ride_stop" WHERE "ride_id" IN (SELECT "id" FROM "ride" WHERE "org_id" = '${testOrgId}')`,
      );
      await rideRepository.query(
        `DELETE FROM "ride" WHERE "org_id" = '${testOrgId}'`,
      );
      await userRepository.query(
        `DELETE FROM "user" WHERE "org_id" = '${testOrgId}'`,
      );
      await organizationRepository.delete(testOrgId);
    }
    if (app) await app.close();
  });

  beforeEach(async () => {
    const createRes = await request(httpServer)
      .post('/rides')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        ...baseRideDto,
        organizationId: testOrgId,
        driverId: testDriverId,
        maxSeatsAmount: 2,
        startsAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
        estimatedEndsAt: new Date(
          Date.now() + 1000 * 60 * 60 * 3,
        ).toISOString(),
      });
    rideId = createRes.body.id as UUID;

    const stops = await rideStopRepository.save([
      rideStopRepository.create({
        ride: { id: rideId },
        location: { type: 'Point', coordinates: [34.8, 31.05] },
        locationName: 'Stop A',
        estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 90),
        orderIndex: 0,
      }),
      rideStopRepository.create({
        ride: { id: rideId },
        location: { type: 'Point', coordinates: [34.9, 31.1] },
        locationName: 'Stop B',
        estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 120),
        orderIndex: 1,
      }),
      rideStopRepository.create({
        ride: { id: rideId },
        location: { type: 'Point', coordinates: [35.0, 31.15] },
        locationName: 'Stop C',
        estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 150),
        orderIndex: 2,
      }),
    ]);
    rideStopId = stops[0]!.id as UUID;
    altRideStopId = stops[1]!.id as UUID;

    const passwordHash = await bcrypt.hash(passengerUser.password, 10);
    await userRepository.save(
      userRepository.create({
        id: passengerUser.id,
        firstName: passengerUser.firstName,
        lastName: passengerUser.lastName,
        nationalId: passengerUser.nationalId,
        email: passengerUser.email,
        phoneNumber: passengerUser.phoneNumber,
        passwordHash,
        role: UserRole.BASIC_USER,
        organization: { id: testOrgId },
      }),
    );

    const loginRes = await request(httpServer).post('/auth/login').send({
      nationalId: passengerUser.nationalId,
      password: passengerUser.password,
    });
    passengerAccessToken = loginRes.body.accessToken;
  });

  afterEach(async () => {
    if (rideId) {
      await ridePassengerRepository.query(
        `DELETE FROM "ride_passenger" WHERE "ride_id" = '${rideId}'`,
      );
      await rideStopRepository.query(
        `DELETE FROM "ride_stop" WHERE "ride_id" = '${rideId}'`,
      );
      await rideRepository.delete(rideId);
      rideId = undefined!;
    }
    await userRepository.delete(passengerUser.id);
  });

  describe('POST /rides/:rideId/passengers', () => {
    it('should allow a user to join a ride', async () => {
      const response = await request(httpServer)
        .post(`/rides/${rideId}/passengers`)
        .set('Authorization', `Bearer ${passengerAccessToken}`)
        .send({ rideStopId });

      expect(response.status).toEqual(201);
    });

    it('should return 409 if user already joined', async () => {
      await request(httpServer)
        .post(`/rides/${rideId}/passengers`)
        .set('Authorization', `Bearer ${passengerAccessToken}`)
        .send({ rideStopId });

      const response = await request(httpServer)
        .post(`/rides/${rideId}/passengers`)
        .set('Authorization', `Bearer ${passengerAccessToken}`)
        .send({ rideStopId });

      expect(response.status).toEqual(409);
      expect(response.body.message).toEqual(
        `User ${passengerUser.id} has already joined ride ${rideId}`,
      );
    });

    it('should return 400 if ride is full', async () => {
      const secondPassenger = {
        id: crypto.randomUUID() as UUID,
        password: 'SecondPass123!',
        nationalId: `second-passenger-${Date.now()}`,
        email: `second.passenger.${Date.now()}@test.com`,
        phoneNumber: `second-passenger.+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
      };
      const thirdPassenger = {
        id: crypto.randomUUID() as UUID,
        password: 'ThirdPass123!',
        nationalId: `third-passenger-${Date.now()}`,
        email: `third.passenger.${Date.now()}@test.com`,
        phoneNumber: `third-passenger.+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
      };

      await userRepository.save([
        userRepository.create({
          id: secondPassenger.id,
          firstName: 'Second',
          lastName: 'Passenger',
          nationalId: secondPassenger.nationalId,
          email: secondPassenger.email,
          phoneNumber: secondPassenger.phoneNumber,
          passwordHash: await bcrypt.hash(secondPassenger.password, 10),
          role: UserRole.BASIC_USER,
          organization: { id: testOrgId },
        }),
        userRepository.create({
          id: thirdPassenger.id,
          firstName: 'Third',
          lastName: 'Passenger',
          nationalId: thirdPassenger.nationalId,
          email: thirdPassenger.email,
          phoneNumber: thirdPassenger.phoneNumber,
          passwordHash: await bcrypt.hash(thirdPassenger.password, 10),
          role: UserRole.BASIC_USER,
          organization: { id: testOrgId },
        }),
      ]);

      const login2 = await request(httpServer).post('/auth/login').send({
        nationalId: secondPassenger.nationalId,
        password: secondPassenger.password,
      });
      const login3 = await request(httpServer).post('/auth/login').send({
        nationalId: thirdPassenger.nationalId,
        password: thirdPassenger.password,
      });

      await request(httpServer)
        .post(`/rides/${rideId}/passengers`)
        .set('Authorization', `Bearer ${passengerAccessToken}`)
        .send({ rideStopId });
      await request(httpServer)
        .post(`/rides/${rideId}/passengers`)
        .set('Authorization', `Bearer ${login2.body.accessToken}`)
        .send({ rideStopId });

      const response = await request(httpServer)
        .post(`/rides/${rideId}/passengers`)
        .set('Authorization', `Bearer ${login3.body.accessToken}`)
        .send({ rideStopId });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('Ride is full');

      await ridePassengerRepository.query(
        `DELETE FROM "ride_passenger" WHERE "ride_id" = '${rideId}'`,
      );
      await userRepository.delete([secondPassenger.id, thirdPassenger.id]);
    });

    it('should return 404 for invalid ride stop', async () => {
      const fakeStopId = '22222222-2222-4222-8222-222222222222';
      const response = await request(httpServer)
        .post(`/rides/${rideId}/passengers`)
        .set('Authorization', `Bearer ${passengerAccessToken}`)
        .send({ rideStopId: fakeStopId });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual(
        `Ride stop with ID ${fakeStopId} not found on ride with ID ${rideId}`,
      );
    });

    it('should return 404 for non-existent ride', async () => {
      const fakeRideId = '33333333-3333-4333-8333-333333333333';
      const response = await request(httpServer)
        .post(`/rides/${fakeRideId}/passengers`)
        .set('Authorization', `Bearer ${passengerAccessToken}`)
        .send({ rideStopId });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual(
        `Ride with ID ${fakeRideId} not found`,
      );
    });

    it('should return 401 without auth token', async () => {
      const response = await request(httpServer)
        .post(`/rides/${rideId}/passengers`)
        .send({ rideStopId });

      expect(response.status).toEqual(401);
    });
  });

  describe('PATCH /rides/:rideId/passengers/:userId', () => {
    it('should allow a passenger to change their ride stop', async () => {
      await request(httpServer)
        .post(`/rides/${rideId}/passengers`)
        .set('Authorization', `Bearer ${passengerAccessToken}`)
        .send({ rideStopId });

      const response = await request(httpServer)
        .patch(`/rides/${rideId}/passengers/${passengerUser.id}`)
        .set('Authorization', `Bearer ${passengerAccessToken}`)
        .send({ rideStopId: altRideStopId });

      expect(response.status).toEqual(200);
    });

    it("should return 403 if the passenger tries to update another passenger's record", async () => {
      const response = await request(httpServer)
        .patch(`/rides/${rideId}/passengers/${passengerUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ rideStopId: altRideStopId });

      expect(response.status).toEqual(403);
      expect(response.body.message).toEqual(
        'You can only update your own ride passenger record',
      );
    });

    it('should return 404 for trying to update to a stop not on this ride', async () => {
      await request(httpServer)
        .post(`/rides/${rideId}/passengers`)
        .set('Authorization', `Bearer ${passengerAccessToken}`)
        .send({ rideStopId });

      const fakeStopId = '44444444-4444-4444-8444-444444444444';
      const response = await request(httpServer)
        .patch(`/rides/${rideId}/passengers/${passengerUser.id}`)
        .set('Authorization', `Bearer ${passengerAccessToken}`)
        .send({ rideStopId: fakeStopId });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual(
        `Ride stop with ID ${fakeStopId} not found on ride with ID ${rideId}`,
      );
    });

    it('should return 403 for a non-existent passenger record', async () => {
      const fakeUserId = '55555555-5555-4555-8555-555555555555';
      const response = await request(httpServer)
        .patch(`/rides/${rideId}/passengers/${fakeUserId}`)
        .set('Authorization', `Bearer ${passengerAccessToken}`)
        .send({ rideStopId: altRideStopId });

      expect(response.status).toEqual(403);
      expect(response.body.message).toEqual(
        `You can only update your own ride passenger record`,
      );
    });

    it('should return 401 without auth token', async () => {
      const response = await request(httpServer)
        .patch(`/rides/${rideId}/passengers/${passengerUser.id}`)
        .send({ rideStopId: altRideStopId });

      expect(response.status).toEqual(401);
    });
  });

  describe('DELETE /rides/:rideId/passengers/:userId', () => {
    it('should allow a passenger to leave the ride', async () => {
      await request(httpServer)
        .post(`/rides/${rideId}/passengers`)
        .set('Authorization', `Bearer ${passengerAccessToken}`)
        .send({ rideStopId });

      const response = await request(httpServer)
        .delete(`/rides/${rideId}/passengers/${passengerUser.id}`)
        .set('Authorization', `Bearer ${passengerAccessToken}`);

      expect(response.status).toEqual(204);
    });

    it("should return 403 if the passenger tries to leave another passenger's ride", async () => {
      const response = await request(httpServer)
        .delete(`/rides/${rideId}/passengers/${passengerUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(403);
      expect(response.body.message).toEqual(
        'You can only remove your own ride passenger record',
      );
    });

    it('should return 403 for trying to leave on behalf of a different user', async () => {
      const fakeUserId = '66666666-6666-4666-8666-666666666666';
      const response = await request(httpServer)
        .delete(`/rides/${rideId}/passengers/${fakeUserId}`)
        .set('Authorization', `Bearer ${passengerAccessToken}`);

      expect(response.status).toEqual(403);
      expect(response.body.message).toEqual(
        'You can only remove your own ride passenger record',
      );
    });

    it('should return 404 after already leaving a ride', async () => {
      await request(httpServer)
        .post(`/rides/${rideId}/passengers`)
        .set('Authorization', `Bearer ${passengerAccessToken}`)
        .send({ rideStopId });

      await request(httpServer)
        .delete(`/rides/${rideId}/passengers/${passengerUser.id}`)
        .set('Authorization', `Bearer ${passengerAccessToken}`);

      const response = await request(httpServer)
        .delete(`/rides/${rideId}/passengers/${passengerUser.id}`)
        .set('Authorization', `Bearer ${passengerAccessToken}`);

      expect(response.status).toEqual(404);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(httpServer).delete(
        `/rides/${rideId}/passengers/${passengerUser.id}`,
      );

      expect(response.status).toEqual(401);
    });
  });
});
