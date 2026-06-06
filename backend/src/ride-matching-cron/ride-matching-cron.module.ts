import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ride } from '../database/entities/ride.entity';
import { User } from '../database/entities/user.entity';
import { NotificationModule } from '../notification/notification.module';
import { RideMatchingCronService } from './ride-matching-cron.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Ride]), NotificationModule],
  providers: [RideMatchingCronService],
  exports: [RideMatchingCronService],
})
export class RideMatchingCronModule {}
