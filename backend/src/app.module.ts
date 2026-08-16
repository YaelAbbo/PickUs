import { BullModule } from '@nestjs/bull';
import { Module, type MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { MapModule } from './map/map.module';
import { NotificationModule } from './notification/notification.module';
import { RideMatchingCronModule } from './ride-matching-cron/ride-matching-cron.module';
import { RidePassengerModule } from './ride-passenger/ride-passenger.module';
import { RideModule } from './ride/ride.module';
import { UserModule } from './user/user.module';
import { RequestLoggerMiddleware } from './utils/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true, // No envFilePath — docker-compose injects vars via env_file
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    TerminusModule,
    AuthModule,
    UserModule,
    RideModule,
    MapModule,
    RidePassengerModule,
    NotificationModule,
    AiModule,
    RideMatchingCronModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
