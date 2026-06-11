import { AiModule } from '@/ai/ai.module';
import { Ride } from '@/database/entities';
import { MapModule } from '@/map/map.module';
import { NotificationModule } from '@/notification/notification.module';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideController } from './ride.controller';
import { RideService } from './ride.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride]),
    NotificationModule,
    forwardRef(() => MapModule),
    AiModule,
  ],
  controllers: [RideController],
  providers: [RideService],
  exports: [RideService],
})
export class RideModule {}
