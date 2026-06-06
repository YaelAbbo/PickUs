import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { configDotenv } from 'dotenv';
import { join } from 'path';
import { AppModule } from './app.module';

configDotenv({ path: join(__dirname, '../../.env') });

async function bootstrap() {
  const logger = new Logger();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        console.log('Validation failed:', JSON.stringify(errors, null, 2));

        return new BadRequestException(errors);
      },
    }),
  );

  const {
    FRONTEND_BASE_URL = 'http://localhost',
    BACKEND_PORT = 3000,
    BASE_URL,
  } = process.env;

  console.log({ FRONTEND_BASE_URL });

  app.enableCors({ origin: [FRONTEND_BASE_URL], credentials: true });

  await app.listen(BACKEND_PORT);

  logger.log(`Backend running on ${BASE_URL}/api`);
}

void bootstrap();
