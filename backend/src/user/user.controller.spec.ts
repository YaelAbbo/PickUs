import { createTestApp } from '@/test/createTestApp';
import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { UUID } from 'crypto';
import { Server } from 'http';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AuthModule } from '../auth/auth.module';
import { Organization, User, UserRole } from '../database/entities';
import { MailService } from '../mail/mail.service';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;

  const adminUser = {
    id: '11111111-1111-1111-1111-111111111111' as UUID,
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User',
    nationalId: 'admin-national-id',
    email: 'admin@test.com',
  };

  const newUser = {
    firstName: 'New',
    lastName: 'Employee',
    nationalId: 'employee-national-id',
    email: 'new.employee@test.com',
    role: UserRole.BASIC_USER,
  };

  let testOrgId: Organization['id'] | null = null;
  let adminAccessToken: string;
  let createdUserId: User['id'] | null = null;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp(AuthModule));
    httpServer = app.getHttpServer() as Server;
    userRepository = dataSource.getRepository(User);
    organizationRepository = dataSource.getRepository(Organization);

    // Prevent real SMTP calls during tests
    jest
      .spyOn(app.get(MailService), 'sendTempPasswordEmail')
      .mockResolvedValue(undefined);

    await cleanup();
    const org = organizationRepository.create({ name: 'Test User Org' });
    const savedOrg = await organizationRepository.save(org);
    testOrgId = savedOrg.id;

    const passwordHash = await bcrypt.hash(adminUser.password, 10);
    await userRepository.save(
      userRepository.create({
        id: adminUser.id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        nationalId: adminUser.nationalId,
        email: adminUser.email,
        passwordHash,
        role: UserRole.HR_MANAGER,
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
    if (createdUserId) {
      await userRepository.delete(createdUserId);
      createdUserId = null;
    }
    await userRepository.delete(adminUser.id);
    if (testOrgId) {
      await organizationRepository.delete(testOrgId);
      testOrgId = null;
    }
  };

  describe('User Operations', () => {
    it('POST /users should create a new user', async () => {
      const response = await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          ...newUser,
          organizationId: testOrgId,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe(newUser.firstName);
      expect(response.body.nationalId).toBe(newUser.nationalId);
      expect(response.body.email).toBe(newUser.email);
      expect(response.body.isTempPassword).toBe(true);
      createdUserId = response.body.id;
    });

    it('POST /users should succeed even when email delivery fails', async () => {
      const mailService = app.get(MailService);
      jest
        .spyOn(mailService, 'sendTempPasswordEmail')
        .mockRejectedValueOnce(new Error('SMTP connection refused'));

      const response = await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          firstName: 'Email',
          lastName: 'Fails',
          nationalId: 'email-fail-nid',
          email: 'email.fails@test.com',
          organizationId: testOrgId,
        });

      expect(response.status).toBe(201);
      expect(response.body.isTempPassword).toBe(true);

      await userRepository.delete(response.body.id as UUID);
    });

    it('GET /users/:id should return user details', async () => {
      const response = await request(httpServer)
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdUserId);
      expect(response.body.firstName).toBe(newUser.firstName);
    });

    it('GET /users/organization/:orgId should return all users in organization', async () => {
      const response = await request(httpServer)
        .get(`/users/organization/${testOrgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(
        response.body.find((u: User) => u.id === createdUserId),
      ).toBeDefined();
    });

    it('PATCH /users/:id should update user details', async () => {
      const updatedFirstName = 'UpdatedName';
      const response = await request(httpServer)
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          firstName: updatedFirstName,
        });

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe(updatedFirstName);
    });

    it('PATCH /users/:id should delete profile image when isDeleteImage is true', async () => {
      const imageUrl = 'http://test-image.com/img.jpg';
      const patchRes = await request(httpServer)
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ profileImageUrl: imageUrl });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.profileImageUrl).toBe(imageUrl);

      const deleteRes = await request(httpServer)
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ isDeleteImage: true });

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.profileImageUrl).toBe(null);
    });

    it('DELETE /users/:id should soft delete user', async () => {
      const deleteResponse = await request(httpServer)
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(deleteResponse.status).toBe(200);

      const getResponse = await request(httpServer)
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  it('All endpoints should fail without token', async () => {
    const res1 = await request(httpServer).post('/users').send({});
    const res2 = await request(httpServer).get('/users/some-id');
    const res3 = await request(httpServer).patch('/users/some-id').send({});
    const res4 = await request(httpServer).delete('/users/some-id');

    expect(res1.status).toBe(401);
    expect(res2.status).toBe(401);
    expect(res3.status).toBe(401);
    expect(res4.status).toBe(401);
  });
});
