import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Server } from 'http';
import request from 'supertest';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  Notification,
  Organization,
  Ride,
  RidePassenger,
  RideStatus,
  User,
  UserRole,
} from '../database/entities';
import { MapGateway } from '../map/map.gateway';
import { createTestApp } from '../test/createTestApp';
import { RideModule } from './ride.module';

describe('RideController', () => {
  let app: INestApplication;
  let httpServer: Server;
  let dataSource: DataSource;
  let rideRepository: Repository<Ride>;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let mapGateway: MapGateway;

  let testOrgId: string | null = null;
  let testDriverId: string | null = null;
  let testPassengerId: string | null = null;
  let adminAccessToken: string;
  let createdRideId: string | null = null;

  const adminUser = {
    id: crypto.randomUUID(),
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User',
    nationalId: `admin-nid-${crypto.randomUUID().slice(0, 8)}`,
    email: `admin.ride-${crypto.randomUUID().slice(0, 8)}@test.com`,
    phoneNumber: `admin.+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
  };

  const testDriver = {
    id: crypto.randomUUID(),
    firstName: 'Driver',
    lastName: 'Test',
    nationalId: `driver-nid-${crypto.randomUUID().slice(0, 8)}`,
    email: `driver.ride-${crypto.randomUUID().slice(0, 8)}@test.com`,
    phoneNumber: `driver.+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
  };

  const testPassenger = {
    id: crypto.randomUUID(),
    firstName: 'Passenger',
    lastName: 'Test',
    nationalId: `passenger-nid-${crypto.randomUUID().slice(0, 8)}`,
    email: `passenger.ride-${crypto.randomUUID().slice(0, 8)}@test.com`,
    phoneNumber: `passenger.+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
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
    mapGateway = app.get(MapGateway);

    await cleanup();

    const orgName = `Ride Test Org ${crypto.randomUUID()}`;
    const org = organizationRepository.create({ name: orgName });
    const savedOrg = await organizationRepository.save(org);
    testOrgId = savedOrg.id;

    const driver = userRepository.create({
      id: testDriver.id,
      firstName: testDriver.firstName,
      lastName: testDriver.lastName,
      nationalId: testDriver.nationalId,
      email: testDriver.email,
      phoneNumber: testDriver.phoneNumber,
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
      phoneNumber: testPassenger.phoneNumber,
      passwordHash: 'dummyhash',
      role: UserRole.BASIC_USER,
      organization: savedOrg,
    });
    await userRepository.save(passenger);
    testPassengerId = passenger.id;

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
    await cleanup();
    if (app) {
      await app.close();
    }
  });

  const cleanup = async () => {
    const userIds = [adminUser.id, testDriverId, testPassengerId].filter(
      Boolean,
    );
    if (userIds.length > 0) {
      const userIdsList = userIds.map((id) => `'${id}'`).join(', ');
      await rideRepository.query(
        `DELETE FROM "notification" WHERE "created_by_user_id" IN (${userIdsList}) OR "ride_id" IN (SELECT "id" FROM "ride" WHERE "driver_id" IN (${userIdsList}))`,
      );
    }

    if (createdRideId) {
      await rideRepository.query(
        `DELETE FROM "notification" WHERE "ride_id" = '${createdRideId}'`,
      );
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

    if (testPassengerId) {
      await userRepository.delete(testPassengerId);
      testPassengerId = null;
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

    it('GET /rides/:id should omit deleted passengers and deleted ride stops', async () => {
      const passengerRepo = dataSource.getRepository(RidePassenger);

      const ride = rideRepository.create({
        organization: { id: testOrgId },
        driver: { id: testDriverId },
        startsAt: new Date(Date.now() + 1000 * 60 * 120),
        estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
        maxSeatsAmount: 4,
        rideStatus: RideStatus.PENDING,
        rideStops: [
          {
            location: { type: 'Point', coordinates: [34.8516, 31.0461] },
            locationName: 'Start',
            estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 120),
            orderIndex: 1,
          },
          {
            location: { type: 'Point', coordinates: [34.7818, 32.0853] },
            locationName: 'Deleted Stop',
            estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 140),
            orderIndex: 2,
            isDeleted: true,
          },
        ],
      } as DeepPartial<Ride>);

      const savedRide = (await rideRepository.save(ride)) as Ride;

      const firstRideStop = savedRide.rideStops?.[0];
      expect(firstRideStop).toBeDefined();

      const activePassenger = passengerRepo.create({
        ride: { id: savedRide.id },
        user: { id: testPassengerId },
        rideStop: { id: firstRideStop!.id },
      } as DeepPartial<RidePassenger>);
      await passengerRepo.save(activePassenger);

      const deletedPassengerUser = userRepository.create({
        id: crypto.randomUUID(),
        firstName: 'Deleted',
        lastName: 'Passenger',
        nationalId: `deleted-passenger-${crypto.randomUUID()}`,
        email: `deleted-passenger-${crypto.randomUUID()}@ride-test.com`,
        phoneNumber: `deleted-passenger-+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
        passwordHash: 'dummyhash',
        role: UserRole.BASIC_USER,
        organization: { id: testOrgId },
        isDeleted: true,
      } as DeepPartial<User>);
      const deletedPassengerUserSaved = (await userRepository.save(
        deletedPassengerUser,
      )) as User;

      const deletedPassenger = passengerRepo.create({
        ride: { id: savedRide.id },
        user: { id: deletedPassengerUserSaved.id },
        rideStop: { id: firstRideStop!.id },
        isDeleted: true,
      } as DeepPartial<RidePassenger>);
      await passengerRepo.save(deletedPassenger);

      const response = await request(httpServer)
        .get(`/rides/${savedRide.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.rideStops).toHaveLength(1);
      expect(response.body.rideStops[0].locationName).toEqual('Start');
      expect(response.body.passengers).toHaveLength(1);
      expect(response.body.passengers[0].user.id).toEqual(testPassengerId);

      await passengerRepo.query(
        `DELETE FROM "ride_passenger" WHERE "ride_id" = '${savedRide.id}'`,
      );
      await rideRepository.query(
        `DELETE FROM "ride_stop" WHERE "ride_id" = '${savedRide.id}'`,
      );
      await rideRepository.delete(savedRide.id);
      await userRepository.delete(deletedPassengerUser.id);
    });

    it('GET /rides should exclude rides whose driver has been deleted', async () => {
      const deletedDriver = userRepository.create({
        id: crypto.randomUUID(),
        firstName: 'Deleted',
        lastName: 'Driver',
        nationalId: `deleted-driver-${crypto.randomUUID()}`,
        email: `deleted-driver-${crypto.randomUUID()}@ride-test.com`,
        phoneNumber: `deleted-passenger-+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
        passwordHash: 'dummyhash',
        role: UserRole.BASIC_USER,
        organization: { id: testOrgId },
        isDeleted: true,
      } as DeepPartial<User>);
      const deletedDriverSaved = (await userRepository.save(
        deletedDriver,
      )) as User;

      const ride = rideRepository.create({
        organization: { id: testOrgId },
        driver: { id: deletedDriverSaved.id },
        startsAt: new Date(Date.now() + 1000 * 60 * 120),
        estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
        maxSeatsAmount: 4,
        rideStatus: RideStatus.PENDING,
        rideStops: [
          {
            location: { type: 'Point', coordinates: [34.8516, 31.0461] },
            locationName: 'Start',
            estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 120),
            orderIndex: 1,
          },
        ],
      } as DeepPartial<Ride>);
      const savedRide = (await rideRepository.save(ride)) as Ride;

      const response = await request(httpServer)
        .get('/rides')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(
        response.body.find((r: Ride) => r.id === savedRide.id),
      ).toBeUndefined();

      await rideRepository.query(
        `DELETE FROM "ride_stop" WHERE "ride_id" = '${savedRide.id}'`,
      );
      await rideRepository.delete(savedRide.id);
      await userRepository.delete(deletedDriver.id);
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

    it('GET /rides/passenger/:passengerId should return rides for the passenger', async () => {
      const passengerRepo = dataSource.getRepository(RidePassenger);

      const ride = rideRepository.create({
        organization: { id: testOrgId },
        driver: { id: testDriverId },
        startsAt: new Date(Date.now() + 1000 * 60 * 120),
        estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
        maxSeatsAmount: 4,
        rideStatus: RideStatus.PENDING,
        rideStops: [
          {
            location: { type: 'Point', coordinates: [34.8516, 31.0461] },
            locationName: 'Start',
            estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 120),
            orderIndex: 1,
          },
        ],
      } as DeepPartial<Ride>);

      const savedRide = (await rideRepository.save(ride)) as Ride;
      const firstRideStop = savedRide.rideStops?.[0];

      const activePassenger = passengerRepo.create({
        ride: { id: savedRide.id },
        user: { id: testPassengerId },
        rideStop: { id: firstRideStop!.id },
      } as DeepPartial<RidePassenger>);
      await passengerRepo.save(activePassenger);

      const response = await request(httpServer)
        .get(`/rides/passenger/${testPassengerId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toEqual(true);
      const responseRide = response.body.find(
        (r: Ride) => r.id === savedRide.id,
      );
      expect(responseRide).toBeDefined();
      expect(responseRide.passengers[0].user.id).toEqual(testPassengerId);

      await passengerRepo.query(
        `DELETE FROM "ride_passenger" WHERE "ride_id" = '${savedRide.id}'`,
      );
      await rideRepository.query(
        `DELETE FROM "ride_stop" WHERE "ride_id" = '${savedRide.id}'`,
      );
      await rideRepository.delete(savedRide.id);
    });

    it('GET /rides/driver/:driverId should return only future and active drives (excluding past, done, cancelled)', async () => {
      // 1. Future ride (startsAt in future, status PENDING)
      const futureRide = await rideRepository.save(
        rideRepository.create({
          organization: { id: testOrgId },
          driver: { id: testDriverId },
          startsAt: new Date(Date.now() + 1000 * 60 * 120), // 2 hours from now
          estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
        } as DeepPartial<Ride>),
      );

      // 2. Active ride (startsAt in past, estimatedEndsAt in future, status ACTIVE)
      const activeRide = await rideRepository.save(
        rideRepository.create({
          organization: { id: testOrgId },
          driver: { id: testDriverId },
          startsAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
          estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 90), // 90 mins from now
          maxSeatsAmount: 4,
          rideStatus: RideStatus.ACTIVE,
        } as DeepPartial<Ride>),
      );

      // 3. Past ride (startsAt and estimatedEndsAt in the past)
      const pastRide = await rideRepository.save(
        rideRepository.create({
          organization: { id: testOrgId },
          driver: { id: testDriverId },
          startsAt: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
          estimatedEndsAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
        } as DeepPartial<Ride>),
      );

      // 4. Done ride (startsAt in future but status DONE)
      const doneRide = await rideRepository.save(
        rideRepository.create({
          organization: { id: testOrgId },
          driver: { id: testDriverId },
          startsAt: new Date(Date.now() + 1000 * 60 * 120),
          estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.DONE,
        } as DeepPartial<Ride>),
      );

      // 5. Cancelled ride (startsAt in future but status CANCELLED)
      const cancelledRide = await rideRepository.save(
        rideRepository.create({
          organization: { id: testOrgId },
          driver: { id: testDriverId },
          startsAt: new Date(Date.now() + 1000 * 60 * 120),
          estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.CANCELLED,
        } as DeepPartial<Ride>),
      );

      const response = await request(httpServer)
        .get(`/rides/driver/${testDriverId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toEqual(true);

      const returnedIds = response.body.map((r: Ride) => r.id);

      expect(returnedIds).toContain(futureRide.id);
      expect(returnedIds).toContain(activeRide.id);
      expect(returnedIds).not.toContain(pastRide.id);
      expect(returnedIds).not.toContain(doneRide.id);
      expect(returnedIds).not.toContain(cancelledRide.id);

      // Cleanup
      await rideRepository.delete(futureRide.id);
      await rideRepository.delete(activeRide.id);
      await rideRepository.delete(pastRide.id);
      await rideRepository.delete(doneRide.id);
      await rideRepository.delete(cancelledRide.id);
    });

    it('GET /rides/passenger/:passengerId should return only future and active drives (excluding past, done, cancelled)', async () => {
      const passengerRepo = dataSource.getRepository(RidePassenger);

      // 1. Future ride
      const futureRide = await rideRepository.save(
        rideRepository.create({
          organization: { id: testOrgId },
          driver: { id: testDriverId },
          startsAt: new Date(Date.now() + 1000 * 60 * 120),
          estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
          rideStops: [
            {
              location: { type: 'Point', coordinates: [34.8516, 31.0461] },
              locationName: 'Stop1',
              estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 120),
              orderIndex: 1,
            },
          ],
        } as DeepPartial<Ride>),
      );

      // 2. Active ride
      const activeRide = await rideRepository.save(
        rideRepository.create({
          organization: { id: testOrgId },
          driver: { id: testDriverId },
          startsAt: new Date(Date.now() - 1000 * 60 * 30),
          estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 90),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.ACTIVE,
          rideStops: [
            {
              location: { type: 'Point', coordinates: [34.8516, 31.0461] },
              locationName: 'Stop2',
              estimatedArrivalAt: new Date(Date.now() - 1000 * 60 * 30),
              orderIndex: 1,
            },
          ],
        } as DeepPartial<Ride>),
      );

      // 3. Past ride
      const pastRide = await rideRepository.save(
        rideRepository.create({
          organization: { id: testOrgId },
          driver: { id: testDriverId },
          startsAt: new Date(Date.now() - 1000 * 60 * 180),
          estimatedEndsAt: new Date(Date.now() - 1000 * 60 * 120),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
          rideStops: [
            {
              location: { type: 'Point', coordinates: [34.8516, 31.0461] },
              locationName: 'Stop3',
              estimatedArrivalAt: new Date(Date.now() - 1000 * 60 * 180),
              orderIndex: 1,
            },
          ],
        } as DeepPartial<Ride>),
      );

      // Link passenger to stops
      const futureStopId = futureRide.rideStops?.[0]?.id;
      const activeStopId = activeRide.rideStops?.[0]?.id;
      const pastStopId = pastRide.rideStops?.[0]?.id;

      await passengerRepo.save(
        passengerRepo.create({
          ride: { id: futureRide.id },
          user: { id: testPassengerId },
          rideStop: { id: futureStopId },
        } as DeepPartial<RidePassenger>),
      );

      await passengerRepo.save(
        passengerRepo.create({
          ride: { id: activeRide.id },
          user: { id: testPassengerId },
          rideStop: { id: activeStopId },
        } as DeepPartial<RidePassenger>),
      );

      await passengerRepo.save(
        passengerRepo.create({
          ride: { id: pastRide.id },
          user: { id: testPassengerId },
          rideStop: { id: pastStopId },
        } as DeepPartial<RidePassenger>),
      );

      const response = await request(httpServer)
        .get(`/rides/passenger/${testPassengerId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toEqual(true);

      const returnedIds = response.body.map((r: Ride) => r.id);

      expect(returnedIds).toContain(futureRide.id);
      expect(returnedIds).toContain(activeRide.id);
      expect(returnedIds).not.toContain(pastRide.id);

      // Cleanup
      await passengerRepo.query(
        `DELETE FROM "ride_passenger" WHERE "ride_id" IN ('${futureRide.id}', '${activeRide.id}', '${pastRide.id}')`,
      );
      await rideRepository.query(
        `DELETE FROM "ride_stop" WHERE "ride_id" IN ('${futureRide.id}', '${activeRide.id}', '${pastRide.id}')`,
      );
      await rideRepository.delete(futureRide.id);
      await rideRepository.delete(activeRide.id);
      await rideRepository.delete(pastRide.id);
    });

    it('GET /rides/organization/:orgId should omit deleted passengers and deleted ride stops', async () => {
      const passengerRepo = dataSource.getRepository(RidePassenger);

      const ride = rideRepository.create({
        organization: { id: testOrgId },
        driver: { id: testDriverId },
        startsAt: new Date(Date.now() + 1000 * 60 * 120),
        estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
        maxSeatsAmount: 4,
        rideStatus: RideStatus.PENDING,
        rideStops: [
          {
            location: { type: 'Point', coordinates: [34.8516, 31.0461] },
            locationName: 'Start',
            estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 120),
            orderIndex: 1,
          },
          {
            location: { type: 'Point', coordinates: [34.7818, 32.0853] },
            locationName: 'Deleted Stop',
            estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 140),
            orderIndex: 2,
            isDeleted: true,
          },
        ],
      } as DeepPartial<Ride>);

      const savedRide = (await rideRepository.save(ride)) as Ride;
      const firstRideStop = savedRide.rideStops?.[0];
      expect(firstRideStop).toBeDefined();

      const activePassenger = passengerRepo.create({
        ride: { id: savedRide.id },
        user: { id: testPassengerId },
        rideStop: { id: firstRideStop!.id },
      } as DeepPartial<RidePassenger>);
      await passengerRepo.save(activePassenger);

      const deletedPassengerUser = userRepository.create({
        id: crypto.randomUUID(),
        firstName: 'Deleted',
        lastName: 'Passenger',
        nationalId: `deleted-passenger-${crypto.randomUUID()}`,
        email: `deleted-passenger-${crypto.randomUUID()}@ride-test.com`,
        phoneNumber: `deleted-passenger-+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
        passwordHash: 'dummyhash',
        role: UserRole.BASIC_USER,
        organization: { id: testOrgId },
        isDeleted: true,
      } as DeepPartial<User>);
      const deletedPassengerUserSaved = (await userRepository.save(
        deletedPassengerUser,
      )) as User;

      const deletedPassenger = passengerRepo.create({
        ride: { id: savedRide.id },
        user: { id: deletedPassengerUserSaved.id },
        rideStop: { id: firstRideStop!.id },
        isDeleted: true,
      } as DeepPartial<RidePassenger>);
      await passengerRepo.save(deletedPassenger);

      const response = await request(httpServer)
        .get(`/rides/organization/${testOrgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      const responseRide = response.body.find(
        (r: Ride) => r.id === savedRide.id,
      );
      expect(responseRide).toBeDefined();
      expect(responseRide.rideStops).toHaveLength(1);
      expect(responseRide.passengers).toHaveLength(1);
      expect(responseRide.passengers[0].user.id).toEqual(testPassengerId);

      await passengerRepo.query(
        `DELETE FROM "ride_passenger" WHERE "ride_id" = '${savedRide.id}'`,
      );
      await rideRepository.query(
        `DELETE FROM "ride_stop" WHERE "ride_id" = '${savedRide.id}'`,
      );
      await rideRepository.delete(savedRide.id);
      await userRepository.delete(deletedPassengerUserSaved.id);
    });

    it('GET /rides/driver/:driverId should omit deleted passengers and deleted ride stops', async () => {
      const passengerRepo = dataSource.getRepository(RidePassenger);

      const ride = rideRepository.create({
        organization: { id: testOrgId },
        driver: { id: testDriverId },
        startsAt: new Date(Date.now() + 1000 * 60 * 120),
        estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
        maxSeatsAmount: 4,
        rideStatus: RideStatus.PENDING,
        rideStops: [
          {
            location: { type: 'Point', coordinates: [34.8516, 31.0461] },
            locationName: 'Start',
            estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 120),
            orderIndex: 1,
          },
          {
            location: { type: 'Point', coordinates: [34.7818, 32.0853] },
            locationName: 'Deleted Stop',
            estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 140),
            orderIndex: 2,
            isDeleted: true,
          },
        ],
      } as DeepPartial<Ride>);

      const savedRide = (await rideRepository.save(ride)) as Ride;
      const firstRideStop = savedRide.rideStops?.[0];
      expect(firstRideStop).toBeDefined();

      const activePassenger = passengerRepo.create({
        ride: { id: savedRide.id },
        user: { id: testPassengerId },
        rideStop: { id: firstRideStop!.id },
      } as DeepPartial<RidePassenger>);
      await passengerRepo.save(activePassenger);

      const deletedPassengerUser = userRepository.create({
        id: crypto.randomUUID(),
        firstName: 'Deleted',
        lastName: 'Passenger',
        nationalId: `deleted-passenger-${crypto.randomUUID()}`,
        email: `deleted-passenger-${crypto.randomUUID()}@ride-test.com`,
        phoneNumber: `deleted-passenger-+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
        passwordHash: 'dummyhash',
        role: UserRole.BASIC_USER,
        organization: { id: testOrgId },
        isDeleted: true,
      } as DeepPartial<User>);
      const deletedPassengerUserSaved = (await userRepository.save(
        deletedPassengerUser,
      )) as User;

      const deletedPassenger = passengerRepo.create({
        ride: { id: savedRide.id },
        user: { id: deletedPassengerUserSaved.id },
        rideStop: { id: firstRideStop!.id },
        isDeleted: true,
      } as DeepPartial<RidePassenger>);
      await passengerRepo.save(deletedPassenger);

      const response = await request(httpServer)
        .get(`/rides/driver/${testDriverId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      const responseRide = response.body.find(
        (r: Ride) => r.id === savedRide.id,
      );
      expect(responseRide).toBeDefined();
      expect(responseRide.rideStops).toHaveLength(1);
      expect(responseRide.passengers).toHaveLength(1);
      expect(responseRide.passengers[0].user.id).toEqual(testPassengerId);

      await passengerRepo.query(
        `DELETE FROM "ride_passenger" WHERE "ride_id" = '${savedRide.id}'`,
      );
      await rideRepository.query(
        `DELETE FROM "ride_stop" WHERE "ride_id" = '${savedRide.id}'`,
      );
      await rideRepository.delete(savedRide.id);
      await userRepository.delete(deletedPassengerUserSaved.id);
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

    it('PATCH /rides/:id should send notifications and trigger websocket event when ride starts (status transitions to ACTIVE)', async () => {
      const ride = rideRepository.create({
        organization: { id: testOrgId },
        driver: { id: testDriverId },
        startsAt: new Date(Date.now() + 1000 * 60 * 120),
        estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
        maxSeatsAmount: 4,
        rideStatus: RideStatus.PENDING,
        rideStops: [
          {
            location: { type: 'Point', coordinates: [34.8516, 31.0461] },
            locationName: 'Start',
            estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 120),
            orderIndex: 1,
          },
        ],
      } as DeepPartial<Ride>);
      const savedRide = (await rideRepository.save(ride)) as Ride;

      const passengerRepo = dataSource.getRepository(RidePassenger);
      const rideStopId = savedRide.rideStops?.[0]?.id;
      expect(rideStopId).toBeDefined();

      const activePassenger = passengerRepo.create({
        ride: { id: savedRide.id },
        user: { id: testPassengerId },
        rideStop: { id: rideStopId! },
      } as DeepPartial<RidePassenger>);
      await passengerRepo.save(activePassenger);

      const sendNotificationSpy = jest
        .spyOn(mapGateway, 'sendRideStartedNotification')
        .mockImplementation(() => {});

      const response = await request(httpServer)
        .patch(`/rides/${savedRide.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          rideStatus: RideStatus.ACTIVE,
        });

      expect(response.status).toEqual(200);
      expect(response.body.rideStatus).toEqual(RideStatus.ACTIVE);

      expect(sendNotificationSpy).toHaveBeenCalledWith(
        [testPassengerId],
        expect.objectContaining({
          content: expect.stringContaining('התחילה!'),
          rideId: savedRide.id,
        }),
      );

      const notificationRepo = dataSource.getRepository(Notification);
      const notification = await notificationRepo.findOne({
        where: { ride: { id: savedRide.id } },
      });
      expect(notification).not.toBeNull();
      expect(notification?.content).toContain('התחילה!');

      sendNotificationSpy.mockRestore();
      await notificationRepo.delete({ ride: { id: savedRide.id } });
      await passengerRepo.query(
        `DELETE FROM "ride_passenger" WHERE "ride_id" = '${savedRide.id}'`,
      );
      await rideRepository.query(
        `DELETE FROM "ride_stop" WHERE "ride_id" = '${savedRide.id}'`,
      );
      await rideRepository.delete(savedRide.id);
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

    it('GET /rides/available should return only available rides (PENDING status with future start time)', async () => {
      const futureRideResponse = await request(httpServer)
        .post('/rides')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          ...newRideDto,
          organizationId: testOrgId,
          driverId: testDriverId,
          maxSeatsAmount: 2,
          startsAt: new Date(Date.now() + 1000 * 60 * 120).toISOString(), // 2 hours from now
          estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
          rideStatus: RideStatus.PENDING,
        });

      const futureRideId = futureRideResponse.body.id;
      expect(futureRideId).toBeDefined();

      const activeRideResponse = await request(httpServer)
        .post('/rides')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          ...newRideDto,
          organizationId: testOrgId,
          driverId: testDriverId,
          rideStatus: RideStatus.ACTIVE,
          startsAt: new Date(Date.now() + 1000 * 60 * 140).toISOString(),
          estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 200).toISOString(),
        });

      const activeRideId = activeRideResponse.body.id;
      expect(activeRideId).toBeDefined();

      const pastRideResponse = await request(httpServer)
        .post('/rides')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: testOrgId,
          driverId: testDriverId,
          startsAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
          startLocation: { type: 'Point', coordinates: [34.8516, 31.0461] },
          endLocation: { type: 'Point', coordinates: [34.7818, 32.0853] },
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
        });

      const pastRideId = pastRideResponse.body.id;
      expect(pastRideId).toBeDefined();

      const response = await request(httpServer)
        .get(`/rides/available?orgId=${testOrgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toEqual(true);

      const availableFutureRide = response.body.find(
        (r: Ride) => r.id === futureRideId,
      );
      expect(availableFutureRide).toBeDefined();
      expect(availableFutureRide?.rideStatus).toEqual(RideStatus.PENDING);

      const activeRide = response.body.find((r: Ride) => r.id === activeRideId);
      expect(activeRide).toBeUndefined();

      const pastRide = response.body.find((r: Ride) => r.id === pastRideId);
      expect(pastRide).toBeUndefined();

      await rideRepository.delete(futureRideId);
      await rideRepository.delete(activeRideId);
      await rideRepository.delete(pastRideId);
    });

    it('GET /rides/available should fail with 400 when orgId is missing', async () => {
      const response = await request(httpServer)
        .get('/rides/available')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(
        'orgId query parameter is required',
      );
    });

    it('GET /rides/:id/validate should return isRelevant: true for a valid pending ride with available seats', async () => {
      const ride = rideRepository.create({
        organization: { id: testOrgId },
        driver: { id: testDriverId },
        startsAt: new Date(Date.now() + 1000 * 60 * 120),
        estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
        maxSeatsAmount: 4,
        rideStatus: RideStatus.PENDING,
      } as DeepPartial<Ride>);
      const savedRide = await rideRepository.save(ride);

      const response = await request(httpServer)
        .get(`/rides/${savedRide.id}/validate`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ isRelevant: true });

      await rideRepository.delete(savedRide.id);
    });

    it('GET /rides/:id/validate should return RIDE_CANCELLED for cancelled ride', async () => {
      const ride = rideRepository.create({
        organization: { id: testOrgId },
        driver: { id: testDriverId },
        startsAt: new Date(Date.now() + 1000 * 60 * 120),
        estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
        maxSeatsAmount: 4,
        rideStatus: RideStatus.CANCELLED,
      } as DeepPartial<Ride>);
      const savedRide = await rideRepository.save(ride);

      const response = await request(httpServer)
        .get(`/rides/${savedRide.id}/validate`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        isRelevant: false,
        reason: 'RIDE_CANCELLED',
      });

      await rideRepository.delete(savedRide.id);
    });

    it('GET /rides/:id/validate should return RIDE_COMPLETED for done ride', async () => {
      const ride = rideRepository.create({
        organization: { id: testOrgId },
        driver: { id: testDriverId },
        startsAt: new Date(Date.now() + 1000 * 60 * 120),
        estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
        maxSeatsAmount: 4,
        rideStatus: RideStatus.DONE,
      } as DeepPartial<Ride>);
      const savedRide = await rideRepository.save(ride);

      const response = await request(httpServer)
        .get(`/rides/${savedRide.id}/validate`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        isRelevant: false,
        reason: 'RIDE_COMPLETED',
      });

      await rideRepository.delete(savedRide.id);
    });

    it('GET /rides/:id/validate should return RIDE_TIME_PASSED for past ride', async () => {
      const ride = rideRepository.create({
        organization: { id: testOrgId },
        driver: { id: testDriverId },
        startsAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 60),
        maxSeatsAmount: 4,
        rideStatus: RideStatus.PENDING,
      } as DeepPartial<Ride>);
      const savedRide = await rideRepository.save(ride);

      const response = await request(httpServer)
        .get(`/rides/${savedRide.id}/validate`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        isRelevant: false,
        reason: 'RIDE_TIME_PASSED',
      });

      await rideRepository.delete(savedRide.id);
    });

    it('GET /rides/:id/validate should return RIDE_FULL when no available seats', async () => {
      const passengerRepo = dataSource.getRepository(RidePassenger);

      const ride = rideRepository.create({
        organization: { id: testOrgId },
        driver: { id: testDriverId },
        startsAt: new Date(Date.now() + 1000 * 60 * 120),
        estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
        maxSeatsAmount: 1, // Only 1 seat
        rideStatus: RideStatus.PENDING,
        rideStops: [
          {
            location: { type: 'Point', coordinates: [34.8516, 31.0461] },
            locationName: 'Start',
            estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 120),
            orderIndex: 1,
          },
        ],
      } as DeepPartial<Ride>);
      const savedRide = (await rideRepository.save(ride)) as Ride;
      const rideStopId = savedRide.rideStops?.[0]?.id;

      // Fill the ride with a passenger
      const passenger = passengerRepo.create({
        ride: { id: savedRide.id },
        user: { id: testPassengerId },
        rideStop: { id: rideStopId! },
      } as DeepPartial<RidePassenger>);
      await passengerRepo.save(passenger);

      const response = await request(httpServer)
        .get(`/rides/${savedRide.id}/validate`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ isRelevant: false, reason: 'RIDE_FULL' });

      await passengerRepo.query(
        `DELETE FROM "ride_passenger" WHERE "ride_id" = '${savedRide.id}'`,
      );
      await rideRepository.query(
        `DELETE FROM "ride_stop" WHERE "ride_id" = '${savedRide.id}'`,
      );
      await rideRepository.delete(savedRide.id);
    });

    it('GET /rides/:id/validate should return RIDE_NOT_FOUND for non-existent ride', async () => {
      const fakeId = '11111111-1111-4111-8111-111111111111';

      const response = await request(httpServer)
        .get(`/rides/${fakeId}/validate`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        isRelevant: false,
        reason: 'RIDE_NOT_FOUND',
      });
    });

    it('GET /rides/driver/:driverId/history should return only past rides for driver', async () => {
      const doneRide = await rideRepository.save(
        rideRepository.create({
          organization: { id: testOrgId },
          driver: { id: testDriverId },
          startsAt: new Date(Date.now() - 1000 * 60 * 180),
          estimatedEndsAt: new Date(Date.now() - 1000 * 60 * 120),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.DONE,
          rideStops: [
            {
              location: { type: 'Point', coordinates: [34.8516, 31.0461] },
              locationName: 'DoneStop',
              estimatedArrivalAt: new Date(Date.now() - 1000 * 60 * 180),
              orderIndex: 1,
            },
          ],
        } as DeepPartial<Ride>),
      );

      const cancelledRide = await rideRepository.save(
        rideRepository.create({
          organization: { id: testOrgId },
          driver: { id: testDriverId },
          startsAt: new Date(Date.now() - 1000 * 60 * 60),
          estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 60),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.CANCELLED,
          rideStops: [
            {
              location: { type: 'Point', coordinates: [34.8516, 31.0461] },
              locationName: 'CancelledStop',
              estimatedArrivalAt: new Date(Date.now() - 1000 * 60 * 60),
              orderIndex: 1,
            },
          ],
        } as DeepPartial<Ride>),
      );

      const futureRide = await rideRepository.save(
        rideRepository.create({
          organization: { id: testOrgId },
          driver: { id: testDriverId },
          startsAt: new Date(Date.now() + 1000 * 60 * 120),
          estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
          rideStops: [
            {
              location: { type: 'Point', coordinates: [34.8516, 31.0461] },
              locationName: 'FutureStop',
              estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 120),
              orderIndex: 1,
            },
          ],
        } as DeepPartial<Ride>),
      );

      const response = await request(httpServer)
        .get(`/rides/driver/${testDriverId}/history`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toEqual(true);

      const returnedIds = response.body.map((r: Ride) => r.id);
      expect(returnedIds).toContain(doneRide.id);
      expect(returnedIds).not.toContain(cancelledRide.id);
      expect(returnedIds).not.toContain(futureRide.id);

      await rideRepository.query(
        `DELETE FROM "ride_stop" WHERE "ride_id" IN ('${doneRide.id}', '${cancelledRide.id}', '${futureRide.id}')`,
      );
      await rideRepository.delete(doneRide.id);
      await rideRepository.delete(cancelledRide.id);
      await rideRepository.delete(futureRide.id);
    });

    it('GET /rides/passenger/:passengerId/history should return only past rides for passenger', async () => {
      const passengerRepo = dataSource.getRepository(RidePassenger);

      const doneRide = (await rideRepository.save(
        rideRepository.create({
          organization: { id: testOrgId },
          driver: { id: testDriverId },
          startsAt: new Date(Date.now() - 1000 * 60 * 180),
          estimatedEndsAt: new Date(Date.now() - 1000 * 60 * 120),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.DONE,
          rideStops: [
            {
              location: { type: 'Point', coordinates: [34.8516, 31.0461] },
              locationName: 'DoneStop',
              estimatedArrivalAt: new Date(Date.now() - 1000 * 60 * 180),
              orderIndex: 1,
            },
          ],
        } as DeepPartial<Ride>),
      )) as Ride;

      const futureRide = (await rideRepository.save(
        rideRepository.create({
          organization: { id: testOrgId },
          driver: { id: testDriverId },
          startsAt: new Date(Date.now() + 1000 * 60 * 120),
          estimatedEndsAt: new Date(Date.now() + 1000 * 60 * 180),
          maxSeatsAmount: 4,
          rideStatus: RideStatus.PENDING,
          rideStops: [
            {
              location: { type: 'Point', coordinates: [34.8516, 31.0461] },
              locationName: 'FutureStop',
              estimatedArrivalAt: new Date(Date.now() + 1000 * 60 * 120),
              orderIndex: 1,
            },
          ],
        } as DeepPartial<Ride>),
      )) as Ride;

      const doneStopId = doneRide.rideStops?.[0]?.id;
      const futureStopId = futureRide.rideStops?.[0]?.id;

      await passengerRepo.save(
        passengerRepo.create({
          ride: { id: doneRide.id },
          user: { id: testPassengerId },
          rideStop: { id: doneStopId },
        } as DeepPartial<RidePassenger>),
      );

      await passengerRepo.save(
        passengerRepo.create({
          ride: { id: futureRide.id },
          user: { id: testPassengerId },
          rideStop: { id: futureStopId },
        } as DeepPartial<RidePassenger>),
      );

      const response = await request(httpServer)
        .get(`/rides/passenger/${testPassengerId}/history`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toEqual(true);

      const returnedIds = response.body.map((r: Ride) => r.id);
      expect(returnedIds).toContain(doneRide.id);
      expect(returnedIds).not.toContain(futureRide.id);

      await passengerRepo.query(
        `DELETE FROM "ride_passenger" WHERE "ride_id" IN ('${doneRide.id}', '${futureRide.id}')`,
      );
      await rideRepository.query(
        `DELETE FROM "ride_stop" WHERE "ride_id" IN ('${doneRide.id}', '${futureRide.id}')`,
      );
      await rideRepository.delete(doneRide.id);
      await rideRepository.delete(futureRide.id);
    });
  });

  describe('Authorization', () => {
    it('All endpoints should fail with 401 without a valid token', async () => {
      const fakeId = '11111111-1111-4111-8111-111111111111';

      const res1 = await request(httpServer).post('/rides').send({});
      const res2 = await request(httpServer).get('/rides');
      const res3 = await request(httpServer).get(
        '/rides/available?orgId=fake-org-id',
      );
      const res4 = await request(httpServer).get(`/rides/${fakeId}`);
      const res5 = await request(httpServer).get(
        `/rides/organization/${fakeId}`,
      );
      const res6 = await request(httpServer).get(`/rides/driver/${fakeId}`);
      const res7 = await request(httpServer).get(`/rides/passenger/${fakeId}`);
      const res8 = await request(httpServer).patch(`/rides/${fakeId}`).send({});
      const res9 = await request(httpServer).delete(`/rides/${fakeId}`);
      const res10 = await request(httpServer).get(`/rides/${fakeId}/validate`);
      const res11 = await request(httpServer).get(
        `/rides/driver/${fakeId}/history`,
      );
      const res12 = await request(httpServer).get(
        `/rides/passenger/${fakeId}/history`,
      );

      expect(res1.status).toEqual(401);
      expect(res2.status).toEqual(401);
      expect(res3.status).toEqual(401);
      expect(res4.status).toEqual(401);
      expect(res5.status).toEqual(401);
      expect(res6.status).toEqual(401);
      expect(res7.status).toEqual(401);
      expect(res8.status).toEqual(401);
      expect(res9.status).toEqual(401);
      expect(res10.status).toEqual(401);
      expect(res11.status).toEqual(401);
      expect(res12.status).toEqual(401);
    });
  });
});
