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
