import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { AuthController } from './auth.controller';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';

dotenv.config({ path: path.join(__dirname, '../../.env.test') });

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let dataSource: DataSource;
  let authService: AuthService;
  let authController: AuthController;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        require('@nestjs/config').ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: path.join(__dirname, '../../.env.test'),
        }),
        require('@nestjs/typeorm').TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME_TEST || 'pickus',
          synchronize: false,
          logging: false,
          entities: [
            path.join(__dirname, '../database/entities/*.entity.{ts,js}'),
          ],
          migrations: [
            path.join(__dirname, '../database/migrations/*.{ts,js}'),
          ],
        }),
        AuthModule,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    dataSource = app.get<DataSource>(DataSource);

    if (dataSource && dataSource.isInitialized) {
      await dataSource.runMigrations();
    }

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.undoLastMigration();
      await dataSource.destroy();
    }

    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    if (dataSource && dataSource.isInitialized) {
      const entities = dataSource.entityMetadatas;
      for (const entity of entities) {
        const repository = dataSource.getRepository(entity.name);
        await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
      }
    }
  });

  afterEach(async () => {
    if (dataSource && dataSource.isInitialized) {
      const entities = dataSource.entityMetadatas;
      for (const entity of entities) {
        const repository = dataSource.getRepository(entity.name);
        await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
      }
    }
  });

  describe('AuthController', () => {
    it('should be defined', () => {
      expect(authController).toBeDefined();
    });
  });
});
