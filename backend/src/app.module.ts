import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { MapModule } from './map/map.module';
import { RideModule } from './ride/ride.module';
import { UserModule } from './user/user.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true, // No envFilePath — docker-compose injects vars via env_file
    }),
    DatabaseModule,
    TerminusModule,
    AuthModule,
    UserModule,
    RideModule,
    MapModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
