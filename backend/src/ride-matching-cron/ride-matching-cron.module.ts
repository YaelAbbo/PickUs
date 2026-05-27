import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../database/entities/notification.entity';
import { Ride } from '../database/entities/ride.entity';
import { User } from '../database/entities/user.entity';
import { RideMatchingCronService } from './ride-matching-cron.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Ride, Notification])],
  providers: [RideMatchingCronService],
  exports: [RideMatchingCronService],
})
export class RideMatchingCronModule {}
