import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Server } from 'http';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  Organization,
  Ride,
  RideStatus,
  User,
  UserRole,
} from '../database/entities';
import { createTestApp } from '../test/createTestApp';
import { RideModule } from './ride.module';

describe('RideController', () => {
  let app: INestApplication;
  let httpServer: Server;
  let dataSource: DataSource;
  let rideRepository: Repository<Ride>;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;

  let testOrgId: string | null = null;
  let testDriverId: string | null = null;
  let adminAccessToken: string;
  let createdRideId: string | null = null;

  const adminUser = {
    id: crypto.randomUUID(),
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User',
    nationalId: 'admin-national-id-ride-test',
    email: 'admin.ride@test.com',
  };

  const testDriver = {
    id: crypto.randomUUID(),
    firstName: 'Driver',
    lastName: 'Test',
    nationalId: 'driver-national-id-test',
    email: 'driver.ride@test.com',
  };

  const newRideDto = {
    startsAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    startLocation: { type: 'Point', coordinates: [34.8516, 31.0461] },
    endLocation: { type: 'Point', coordinates: [34.7818, 32.0853] },
    maxSeatsAmount: 4,
    rideStatus: RideStatus.PENDING,
  };

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp(RideModule, AuthModule));

    httpServer = app.getHttpServer() as Server;
    rideRepository = dataSource.getRepository(Ride);
    userRepository = dataSource.getRepository(User);
    organizationRepository = dataSource.getRepository(Organization);

    await cleanup();

    const org = organizationRepository.create({ name: 'Ride Test Org' });
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
  }, 60000);

  afterAll(async () => {
    await cleanup();
    if (app) {
      await app.close();
    }
  });

  const cleanup = async () => {
    if (createdRideId) {
      await rideRepository.delete(createdRideId);
      createdRideId = null;
    }

    if (testDriverId) {
      if (testOrgId) {
        await rideRepository.query(
          `DELETE FROM "ride" WHERE "driver_id" = '${testDriverId}' OR "org_id" = '${testOrgId}'`,
        );
      } else {
        await rideRepository.query(
          `DELETE FROM "ride" WHERE "driver_id" = '${testDriverId}'`,
        );
      }
    }

    await userRepository.delete(adminUser.id);

    if (testDriverId) {
      await userRepository.delete(testDriverId);
      testDriverId = null;
    }

    if (testOrgId) {
      await organizationRepository.delete(testOrgId);
      testOrgId = null;
    }
  };

  describe('Ride Operations', () => {
    it('POST /rides should create a new ride', async () => {
      const response = await request(httpServer)
        .post('/rides')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          ...newRideDto,
          organizationId: testOrgId,
          driverId: testDriverId,
        });

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.maxSeatsAmount).toEqual(newRideDto.maxSeatsAmount);
      expect(response.body.rideStatus).toEqual(RideStatus.PENDING);

      createdRideId = response.body.id;
    });

    it('GET /rides/:id should return ride details', async () => {
      const response = await request(httpServer)
        .get(`/rides/${createdRideId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.id).toEqual(createdRideId);
      expect(response.body.organization.id).toEqual(testOrgId);
      expect(response.body.driver.id).toEqual(testDriverId);
    });

    it('GET /rides/:id should fail with 404 for non-existent ride', async () => {
      const fakeId = '11111111-1111-4111-8111-111111111111';
      const response = await request(httpServer)
        .get(`/rides/${fakeId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual(`Ride with ID ${fakeId} not found`);
    });

    it('GET /rides should return all rides', async () => {
      const response = await request(httpServer)
        .get('/rides')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toEqual(true);
      expect(
        response.body.find((r: Ride) => r.id === createdRideId),
      ).toBeDefined();
    });

    it('GET /rides/organization/:orgId should return rides for the organization', async () => {
      const response = await request(httpServer)
        .get(`/rides/organization/${testOrgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toEqual(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].driver).toBeDefined();
    });

    it('GET /rides/driver/:driverId should return rides for the driver', async () => {
      const response = await request(httpServer)
        .get(`/rides/driver/${testDriverId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toEqual(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].organization).toBeDefined();
    });

    it('PATCH /rides/:id should update ride details', async () => {
      const updatedSeats = 2;
      const response = await request(httpServer)
        .patch(`/rides/${createdRideId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          maxSeatsAmount: updatedSeats,
          rideStatus: RideStatus.ACTIVE,
        });

      expect(response.status).toEqual(200);
      expect(response.body.maxSeatsAmount).toEqual(updatedSeats);
      expect(response.body.rideStatus).toEqual(RideStatus.ACTIVE);
    });

    it('PATCH /rides/:id should fail with 404 for non-existent ride', async () => {
      const fakeId = '11111111-1111-4111-8111-111111111111';
      const updatedSeats = 2;
      const response = await request(httpServer)
        .patch(`/rides/${fakeId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          maxSeatsAmount: updatedSeats,
          rideStatus: RideStatus.ACTIVE,
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual(`Ride with ID ${fakeId} not found`);
    });

    it('DELETE /rides/:id should delete the ride', async () => {
      const deleteResponse = await request(httpServer)
        .delete(`/rides/${createdRideId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(deleteResponse.status).toEqual(200);

      const getResponse = await request(httpServer)
        .get(`/rides/${createdRideId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(getResponse.status).toEqual(404);
      expect(getResponse.body.message).toEqual(
        `Ride with ID ${createdRideId} not found`,
      );
      createdRideId = null;
    });

    it('DELETE /rides/:id should fail with 404 for non-existent ride', async () => {
      const fakeId = '11111111-1111-4111-8111-111111111111';
      const deleteResponse = await request(httpServer)
        .delete(`/rides/${fakeId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(deleteResponse.status).toEqual(404);
      expect(deleteResponse.body.message).toEqual(
        `Ride with ID ${fakeId} not found`,
      );
    });
  });

  it('All endpoints should fail with 401 without a valid token', async () => {
    const fakeId = '11111111-1111-4111-8111-111111111111';

    const res1 = await request(httpServer).post('/rides').send({});
    const res2 = await request(httpServer).get('/rides');
    const res3 = await request(httpServer).get(`/rides/${fakeId}`);
    const res4 = await request(httpServer).get(`/rides/organization/${fakeId}`);
    const res5 = await request(httpServer).get(`/rides/driver/${fakeId}`);
    const res6 = await request(httpServer).patch(`/rides/${fakeId}`).send({});
    const res7 = await request(httpServer).delete(`/rides/${fakeId}`);

    expect(res1.status).toEqual(401);
    expect(res2.status).toEqual(401);
    expect(res3.status).toEqual(401);
    expect(res4.status).toEqual(401);
    expect(res5.status).toEqual(401);
    expect(res6.status).toEqual(401);
    expect(res7.status).toEqual(401);
  });
});
