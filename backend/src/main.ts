import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { configDotenv } from 'dotenv';
import { join } from 'path';
import { AppModule } from './app.module';

configDotenv({ path: join(__dirname, '../../.env') });

async function bootstrap() {
  const logger = new Logger();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.set('trust proxy', 1);

  const { FRONTEND_BASE_URL, BACKEND_PORT = 3000, BASE_URL } = process.env;

  app.enableCors({
    origin: [FRONTEND_BASE_URL || 'http://localhost:8081'],
    credentials: true,
  });

  await app.listen(BACKEND_PORT);

  logger.log(`Backend running on ${BASE_URL}/api`);
}

void bootstrap();
