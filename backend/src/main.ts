import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { configDotenv } from 'dotenv';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './utils/all-exceptions.filter';

configDotenv({ path: join(__dirname, '../../.env') });

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

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
  app.useGlobalFilters(new AllExceptionsFilter());

  const {
    // FRONTEND_BASE_URL = 'http://localhost',
    // FRONTEND_URL = `${FRONTEND_BASE_URL}:8081`,
    BACKEND_PORT = 3000,
    BASE_URL,
  } = process.env;

  // const corsOrigins = [FRONTEND_BASE_URL, FRONTEND_URL];

  // TODO: Revert when we'll know how to access from an Android device
  // app.enableCors({ origin: corsOrigins, credentials: true });
  app.enableCors({ origin: true, credentials: true });

  await app.listen(BACKEND_PORT);

  logger.log(`Backend running on ${BASE_URL}/api`);
  // logger.log(`Accepting requests from origins: ${corsOrigins.join(', ')}`);
  logger.log('Accepting requests from all origins');
}

void bootstrap();
