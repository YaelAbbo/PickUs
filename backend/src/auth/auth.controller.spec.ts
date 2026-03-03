import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '../database/database.module';
import { Organization } from '../database/entities';
import { User, UserRole } from '../database/entities/user.entity';
import { AuthModule } from './auth.module';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;

  const testUser = {
    id: '36b8f84d-df4e-4d49-b662-bcde71a8764f',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
  };

  let createdOrganizationgId: string | null = null;

  beforeAll(async () => {
    // If DB_HOST is 'db' (from .env for docker), we need to use 'localhost' for local tests
    if (process.env.DB_HOST === 'db') {
      process.env.DB_HOST = 'localhost';
    }

    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        DatabaseModule,
        AuthModule,
      ],
    }).compile();

    app = testingModule.createNestApplication();
    app.use(cookieParser());
    await app.init();

    dataSource = app.get(DataSource);
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
    if (createdOrganizationgId) {
      await organizationRepository.delete(createdOrganizationgId);
      createdOrganizationgId = null;
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
    createdOrganizationgId = savedOrganization.id;

    const passwordHash = await bcrypt.hash(testUser.password, 10);
    const user: User = userRepository.create({
      id: testUser.id,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      passwordHash: passwordHash,
      role: UserRole.BASIC_USER,
      organization: savedOrganization,
    });
    return userRepository.save(user);
  };

  it('/auth/login (POST) should return accessToken and set refresh cookie', async () => {
    await insertUser();

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        id: testUser.id,
        password: testUser.password,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('accessToken');

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
        id: testUser.id,
        password: 'wrong_password',
      });

    expect(response.status).toBe(401);
  });

  it('/auth/refresh (POST) should get new accessToken and refreshToken', async () => {
    await insertUser();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        id: testUser.id,
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
        id: testUser.id,
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
