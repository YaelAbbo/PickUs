import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { Organization, User, UserRole } from '../database/entities';
import { UserModule } from './user.module';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;

  const adminUser = {
    id: '11111111-1111-1111-1111-111111111111',
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User',
    nationalId: 'admin-national-id',
  };

  const newUser = {
    firstName: 'New',
    lastName: 'Employee',
    nationalId: 'employee-national-id',
    role: UserRole.BASIC_USER,
  };

  let testOrgId: string | null = null;
  let adminAccessToken: string;
  let createdUserId: string | null = null;

  beforeAll(async () => {
    if (process.env.DB_HOST === 'db') {
      process.env.DB_HOST = 'localhost';
    }

    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        UserModule,
        AuthModule,
      ],
    }).compile();

    app = testingModule.createNestApplication();
    app.use(cookieParser());
    await app.init();

    dataSource = app.get(DataSource);
    userRepository = dataSource.getRepository(User);
    organizationRepository = dataSource.getRepository(Organization);

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
        passwordHash,
        role: UserRole.HR_MANAGER,
        organization: savedOrg,
      }),
    );

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ id: adminUser.id, password: adminUser.password });
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
      const response = await request(app.getHttpServer())
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
      createdUserId = response.body.id;
    });

    it('GET /users/:id should return user details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdUserId);
      expect(response.body.firstName).toBe(newUser.firstName);
    });

    it('GET /users/organization/:orgId should return all users in organization', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/organization/${testOrgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.find((u: User) => u.id === createdUserId)).toBeDefined();
    });

    it('PATCH /users/:id should update user details', async () => {
      const updatedFirstName = 'UpdatedName';
      const response = await request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          firstName: updatedFirstName,
        });

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe(updatedFirstName);
    });

    it('DELETE /users/:id should soft delete user', async () => {
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(deleteResponse.status).toBe(200);

      const getResponse = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  it('All endpoints should fail without token', async () => {
      const res1 = await request(app.getHttpServer()).post('/users').send({});
      const res2 = await request(app.getHttpServer()).get('/users/some-id');
      const res3 = await request(app.getHttpServer()).patch('/users/some-id').send({});
      const res4 = await request(app.getHttpServer()).delete('/users/some-id');

      expect(res1.status).toBe(401);
      expect(res2.status).toBe(401);
      expect(res3.status).toBe(401);
      expect(res4.status).toBe(401);
  });
});
