import { DatabaseModule } from '@/database/database.module';
import type { INestApplication, ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';

export type TestApp = { app: INestApplication; dataSource: DataSource };

export const createTestApp = async (
  ...featureModules: NonNullable<ModuleMetadata['imports']>
) => {
  process.env.DB_HOST = 'localhost';
  process.env.FRONTEND_URL =
    process.env.FRONTEND_URL ?? 'http://localhost:8081';
  process.env.SMTP_FROM = process.env.SMTP_FROM ?? 'test@test.com';
  process.env.SMTP_HOST = process.env.SMTP_HOST ?? 'localhost';
  process.env.SMTP_USER = process.env.SMTP_USER ?? 'test';
  process.env.SMTP_PASS = process.env.SMTP_PASS ?? 'test';

  const testingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, envFilePath: '../.env' }),
      DatabaseModule,
      ...featureModules,
    ],
  }).compile();

  const app = testingModule.createNestApplication();
  app.use(cookieParser());

  await app.init();

  const dataSource = app.get(DataSource);

  return { app, dataSource };
};
