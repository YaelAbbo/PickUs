import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { MapModule } from './map/map.module';
import { RideMatchingCronModule } from './ride-matching-cron/ride-matching-cron.module';
import { RidePassengerModule } from './ride-passenger/ride-passenger.module';
import { RideModule } from './ride/ride.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true, // No envFilePath — docker-compose injects vars via env_file
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
    RideMatchingCronModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
