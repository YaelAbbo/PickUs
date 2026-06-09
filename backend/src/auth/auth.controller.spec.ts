import { createTestApp } from '@/test/createTestApp';
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
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { Organization } from '../database/entities';
import { User, UserRole } from '../database/entities/user.entity';
import { AuthModule } from './auth.module';
//
describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;

  const testUser = {
    id: crypto.randomUUID() as UUID,
    password: 'Password123!',
    nationalId: `auth-nid-${crypto.randomUUID().slice(0, 8)}`,
    firstName: 'Test',
    lastName: 'User',
    email: `auth-test-${crypto.randomUUID().slice(0, 8)}@test.com`,
    phoneNumber: `+97250${Math.floor(1000000 + Math.random() * 9000000)}`,
  };

  let createdOrganizationId: Organization['id'] | null = null;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp(AuthModule));

    userRepository = dataSource.getRepository(User);
    organizationRepository = dataSource.getRepository(Organization);
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const cleanup = async () => {
    await userRepository.delete(testUser.id);
    if (createdOrganizationId) {
      await organizationRepository.delete(createdOrganizationId);
      createdOrganizationId = null;
    }
  };

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  const insertUser = async () => {
    const organization: Organization = organizationRepository.create({
      name: `Test Org ${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
    const savedOrganization: Organization =
      await organizationRepository.save(organization);
    createdOrganizationId = savedOrganization.id;

    const passwordHash = await bcrypt.hash(testUser.password, 10);
    const user: User = userRepository.create({
      id: testUser.id,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      email: testUser.email,
      phoneNumber: testUser.phoneNumber,
      passwordHash: passwordHash,
      role: UserRole.BASIC_USER,
      organization: savedOrganization,
      nationalId: testUser.nationalId,
    });
    return userRepository.save(user);
  };

  it('/auth/login (POST) should return accessToken and set refresh cookie', async () => {
    await insertUser();

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        nationalId: testUser.nationalId,
        password: testUser.password,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('isTempPassword', true);

    const cookies = response.get('Set-Cookie');
    expect(cookies).toBeDefined();
    if (cookies) {
      expect(cookies[0]).toContain('refreshToken=');
      expect(cookies[0]).toContain('HttpOnly');
    }
  });

  it('/auth/login (POST) should fail with invalid credentials', async () => {
    await insertUser();

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        nationalId: testUser.nationalId,
        password: 'wrong_password',
      });

    expect(response.status).toBe(401);
  });

  it('/auth/refresh (POST) should get new accessToken and refreshToken', async () => {
    await insertUser();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        nationalId: testUser.nationalId,
        password: testUser.password,
      });

    const cookies = loginRes.get('Set-Cookie');
    expect(cookies).toBeDefined();
    if (!cookies || !cookies[0]) throw new Error('No cookies set on login');
    const refreshTokenCookie = cookies[0];
    const refreshToken = refreshTokenCookie.split('=')[1]?.split(';')[0];
    if (!refreshToken) throw new Error('Refresh token not found in cookies');

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .send();

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.get('Set-Cookie')).toBeDefined();
  });

  it('/auth/logout (POST) should clear refresh cookie', async () => {
    await insertUser();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        nationalId: testUser.nationalId,
        password: testUser.password,
      });

    const accessToken = loginRes.body.accessToken as string;

    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(response.status).toBe(201);
    const cookies = response.get('Set-Cookie');
    expect(cookies).toBeDefined();
    if (cookies) {
      expect(cookies[0]).toContain('refreshToken=;');
    }
  });
});
